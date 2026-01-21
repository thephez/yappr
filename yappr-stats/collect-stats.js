#!/usr/bin/env node
/**
 * Incremental daily statistics collector for Yappr platform.
 *
 * Usage:
 *   node collect-stats.js                       # Collect stats for today (default)
 *   node collect-stats.js --today               # Same as above (explicit)
 *   node collect-stats.js --date 2026-01-15     # Collect for specific date
 *   node collect-stats.js --backfill 30         # Backfill missing days (up to 30)
 *   node collect-stats.js --force               # Force refresh all days
 *
 * Data format:
 *   data/index.json      - Summary with list of days and totals
 *   data/YYYY-MM-DD.json - Individual day files with posts/users
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSdk, cleanup, paginateFetch } from './lib/sdk.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Yappr contract IDs (testnet)
const YAPPR_CONTRACT_ID = 'AyWK6nDVfb8d1ZmkM5MmZZrThbUyWyso1aMeGuuVSfxf';
const YAPPR_PROFILE_CONTRACT_ID = 'FZSnZdKsLAuWxE7iZJq12eEz6xfGTgKPxK7uZJapTQxe';

// Document types
const DOCUMENT_TYPES = {
  posts: 'post',
  profile: 'profile',
};

// File paths
const DATA_DIR = path.join(__dirname, 'data');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

// Delay between queries (ms) to avoid rate limiting
const QUERY_DELAY = 500;

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    date: null,
    backfill: null,
    force: false,
    today: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      result.date = args[i + 1];
      i++;
    } else if (args[i] === '--backfill' && args[i + 1]) {
      result.backfill = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--force') {
      result.force = true;
    } else if (args[i] === '--today') {
      result.today = true;
    }
  }

  return result;
}

/**
 * Get UTC day boundaries for a given date string (YYYY-MM-DD)
 */
function getDayBoundaries(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  const startMs = date.getTime();
  const endMs = startMs + 24 * 60 * 60 * 1000;
  return { startMs, endMs };
}

/**
 * Get today's date in YYYY-MM-DD format (UTC)
 */
function getTodayDateStr() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get array of date strings for backfill
 */
function getBackfillDates(days) {
  const dates = [];
  const now = new Date();
  for (let i = 0; i < days; i++) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  return dates.reverse(); // Oldest first
}

/**
 * Get path to individual day file
 */
function getDayFilePath(dateStr) {
  return path.join(DATA_DIR, `${dateStr}.json`);
}

/**
 * Check if a day file exists and is complete
 */
function isDayComplete(dateStr) {
  const dayFile = getDayFilePath(dateStr);
  if (!fs.existsSync(dayFile)) return false;

  const todayStr = getTodayDateStr();
  if (dateStr >= todayStr) return false; // Today or future - always recollect

  try {
    const dayData = JSON.parse(fs.readFileSync(dayFile, 'utf-8'));
    if (!dayData.collectedAt) return false;

    const dayEndMs = getDayBoundaries(dateStr).endMs;
    const collectedAtMs = new Date(dayData.collectedAt).getTime();

    return collectedAtMs >= dayEndMs; // Collected after day ended
  } catch {
    return false;
  }
}

/**
 * Fetch documents for a specific day using time range query
 */
async function fetchDocumentsForDay(sdk, contractId, documentType, startMs, endMs) {
  const { documents, count, reachedLimit } = await paginateFetch(
    sdk,
    () => ({
      dataContractId: contractId,
      documentTypeName: documentType,
      where: [
        ['$createdAt', '>=', startMs],
        ['$createdAt', '<', endMs],
      ],
      orderBy: [['$createdAt', 'asc']],
    }),
    { maxResults: 100000, pageSize: 100 }
  );

  if (reachedLimit) {
    console.warn(`  Warning: Reached count limit for ${documentType}`);
  }

  return { documents, count };
}

/**
 * Fetch profiles for a specific day
 * Note: Profile contract doesn't have $createdAt index, so we fetch all and filter
 */
async function fetchProfilesForDay(sdk, startMs, endMs) {
  const { documents, reachedLimit } = await paginateFetch(
    sdk,
    () => ({
      dataContractId: YAPPR_PROFILE_CONTRACT_ID,
      documentTypeName: DOCUMENT_TYPES.profile,
    }),
    { maxResults: 100000, pageSize: 100 }
  );

  if (reachedLimit) {
    console.warn('  Warning: Reached count limit for profiles');
  }

  // Filter by date range
  return documents.filter(doc => {
    const createdAt = doc.$createdAt;
    return createdAt && createdAt >= startMs && createdAt < endMs;
  });
}

/**
 * Extract summary from a post document
 */
function summarizePost(doc) {
  return {
    id: doc.$id,
    ownerId: doc.$ownerId,
    content: doc.content?.substring(0, 100) || '',
    createdAt: doc.$createdAt,
  };
}

/**
 * Extract summary from a profile document
 */
function summarizeProfile(doc) {
  return {
    ownerId: doc.$ownerId,
    displayName: doc.displayName || '',
    createdAt: doc.$createdAt,
  };
}

/**
 * Collect stats for a single day and save to individual file
 */
async function collectDay(sdk, dateStr, profileCache = null) {
  const { startMs, endMs } = getDayBoundaries(dateStr);

  console.log(`Collecting stats for ${dateStr}...`);

  // Fetch posts
  let posts = [];
  let postCount = 0;
  try {
    const { documents, count } = await fetchDocumentsForDay(sdk, YAPPR_CONTRACT_ID, DOCUMENT_TYPES.posts, startMs, endMs);
    postCount = count;
    posts = documents.map(summarizePost);
    console.log(`  posts: ${count}`);
    await new Promise(resolve => setTimeout(resolve, QUERY_DELAY));
  } catch (error) {
    console.error(`  Error fetching posts:`, error.message);
  }

  // Fetch users (from cache or fresh)
  let users = [];
  if (profileCache) {
    users = profileCache
      .filter(doc => {
        const createdAt = doc.$createdAt;
        return createdAt && createdAt >= startMs && createdAt < endMs;
      })
      .map(summarizeProfile);
  } else {
    try {
      const profiles = await fetchProfilesForDay(sdk, startMs, endMs);
      users = profiles.map(summarizeProfile);
      await new Promise(resolve => setTimeout(resolve, QUERY_DELAY));
    } catch (error) {
      console.error(`  Error fetching profiles:`, error.message);
    }
  }
  users.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  console.log(`  newUsers: ${users.length}`);

  // Save day file
  const dayData = {
    date: dateStr,
    collectedAt: new Date().toISOString(),
    posts,
    users,
  };

  const dayFile = getDayFilePath(dateStr);
  fs.writeFileSync(dayFile, JSON.stringify(dayData, null, 2));
  console.log(`  Saved ${dateStr}.json`);

  return { posts: postCount, newUsers: users.length, postList: posts };
}

/**
 * Rebuild index from all day files
 */
function rebuildIndex() {
  const dayFiles = fs.readdirSync(DATA_DIR)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .reverse();

  let totalPosts = 0;
  const uniquePosters = new Set();
  let totalUsers = 0;
  const daySummaries = [];

  for (const file of dayFiles) {
    try {
      const dayData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf-8'));
      const date = file.replace('.json', '');

      totalPosts += dayData.posts?.length || 0;
      totalUsers += dayData.users?.length || 0;

      for (const post of dayData.posts || []) {
        uniquePosters.add(post.ownerId);
      }

      daySummaries.push({
        date,
        posts: dayData.posts?.length || 0,
        newUsers: dayData.users?.length || 0,
      });
    } catch (error) {
      console.warn(`Could not read ${file}:`, error.message);
    }
  }

  const index = {
    lastUpdated: new Date().toISOString(),
    contractId: YAPPR_CONTRACT_ID,
    days: daySummaries,
    totals: {
      posts: totalPosts,
      uniquePosters: uniquePosters.size,
      users: totalUsers,
    },
  };

  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
  console.log(`Updated index.json (${daySummaries.length} days)`);

  return index;
}

/**
 * Fetch all profiles once for batch operations
 */
async function fetchAllProfiles(sdk) {
  console.log('Fetching all profiles...');
  const { documents, reachedLimit } = await paginateFetch(
    sdk,
    () => ({
      dataContractId: YAPPR_PROFILE_CONTRACT_ID,
      documentTypeName: DOCUMENT_TYPES.profile,
    }),
    { maxResults: 100000, pageSize: 100 }
  );

  if (reachedLimit) {
    console.warn('  Warning: Reached count limit for profiles');
  }

  console.log(`  Total profiles: ${documents.length}`);
  return documents;
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();

  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  // Determine which dates to collect
  let dates;
  if (args.backfill) {
    dates = getBackfillDates(args.backfill);
    console.log(`Backfilling up to ${args.backfill} days...`);
  } else if (args.date) {
    dates = [args.date];
  } else {
    dates = [getTodayDateStr()];
  }

  // Filter out already-complete days unless --force is used
  let datesToCollect = dates;
  if (!args.force) {
    datesToCollect = dates.filter(d => !isDayComplete(d));
    const skipped = dates.length - datesToCollect.length;
    if (skipped > 0) {
      console.log(`Skipping ${skipped} already-complete day(s)`);
    }
  }

  if (datesToCollect.length === 0) {
    console.log('No days to collect. Use --force to refresh existing data.');
    return;
  }

  console.log(`Dates to collect: ${datesToCollect.join(', ')}`);
  console.log();

  let sdk;
  try {
    sdk = await getSdk();

    // For batch operations, fetch all profiles once
    let profileCache = null;
    if (datesToCollect.length > 1) {
      profileCache = await fetchAllProfiles(sdk);
      await new Promise(resolve => setTimeout(resolve, QUERY_DELAY));
      console.log();
    }

    // Collect each day
    for (const dateStr of datesToCollect) {
      await collectDay(sdk, dateStr, profileCache);
      console.log();
    }

    // Rebuild index from all day files
    const index = rebuildIndex();

    // Print summary
    console.log('\n=== Summary ===');
    console.log(`Total posts: ${index.totals.posts}`);
    console.log(`Unique posters: ${index.totals.uniquePosters}`);
    console.log(`Total users: ${index.totals.users}`);
    console.log(`Days collected: ${datesToCollect.length}`);

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();
