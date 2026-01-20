#!/usr/bin/env node
/**
 * Daily activity statistics collector for Yappr platform.
 *
 * Usage:
 *   node collect-stats.js                       # Collect stats for today
 *   node collect-stats.js --date 2026-01-15     # Collect for specific date
 *   node collect-stats.js --backfill 30         # Backfill last 30 days
 *   node collect-stats.js --backfill 30 --force # Force refresh all days
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
const DATA_FILE = path.join(__dirname, 'data', 'daily-stats.json');
const TEMPLATE_FILE = path.join(__dirname, 'template.html');
const OUTPUT_HTML = path.join(__dirname, 'index.html');

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
 * Check if a day's stats are complete (collected after the day ended).
 * Returns false if:
 * - Day is missing from stats
 * - Day is today or in the future (always recollect)
 * - Day was collected before it ended (incomplete data)
 */
function isDayComplete(stats, dateStr) {
  const day = stats.days[dateStr];
  if (!day || !day.collectedAt) return false;

  const todayStr = getTodayDateStr();
  if (dateStr >= todayStr) return false; // Today or future - always recollect

  const dayEndMs = getDayBoundaries(dateStr).endMs;
  const collectedAtMs = new Date(day.collectedAt).getTime();

  return collectedAtMs >= dayEndMs; // Collected after day ended
}

/**
 * Fetch documents for a specific day using time range query
 * Returns both count and document summaries
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
 * Fetch all profiles from unified contract and group by date.
 * (unified profile contract has no $createdAt index, so we fetch all once)
 * Returns a Map of dateStr -> array of profile documents
 */
async function fetchAllProfilesByDate(sdk) {
  console.log('Fetching all profiles from unified contract...');
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

  // Group by date (YYYY-MM-DD in UTC)
  const byDate = new Map();
  for (const doc of documents) {
    if (!doc.$createdAt) continue;
    const dateStr = new Date(doc.$createdAt).toISOString().split('T')[0];
    if (!byDate.has(dateStr)) {
      byDate.set(dateStr, []);
    }
    byDate.get(dateStr).push(doc);
  }

  return byDate;
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
 * Collect stats for a single day
 * @param {object} sdk - The EvoSDK instance
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @param {Map} profilesByDate - Pre-fetched profiles grouped by date
 */
async function collectDayStats(sdk, dateStr, profilesByDate) {
  const { startMs, endMs } = getDayBoundaries(dateStr);
  const stats = {};

  console.log(`Collecting stats for ${dateStr}...`);

  // Fetch posts
  try {
    const { documents, count } = await fetchDocumentsForDay(sdk, YAPPR_CONTRACT_ID, DOCUMENT_TYPES.posts, startMs, endMs);
    stats.posts = count;
    stats.postList = documents.map(summarizePost);
    console.log(`  posts: ${count}`);
    await new Promise(resolve => setTimeout(resolve, QUERY_DELAY));
  } catch (error) {
    console.error(`  Error fetching posts:`, error.message);
    stats.posts = null;
    stats.postList = [];
  }

  // Get new users from pre-fetched profiles
  const profiles = profilesByDate.get(dateStr) || [];
  profiles.sort((a, b) => (a.$createdAt || 0) - (b.$createdAt || 0));
  stats.newUsers = profiles.length;
  stats.userList = profiles.map(summarizeProfile);
  console.log(`  newUsers: ${stats.newUsers}`);

  stats.collectedAt = new Date().toISOString();
  return stats;
}

/**
 * Load existing stats from file
 */
function loadStats() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Could not load existing stats:', error.message);
  }

  return {
    lastUpdated: null,
    contractId: YAPPR_CONTRACT_ID,
    days: {},
  };
}

/**
 * Save stats to file
 */
function saveStats(stats) {
  // Ensure data directory exists
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  stats.lastUpdated = new Date().toISOString();
  fs.writeFileSync(DATA_FILE, JSON.stringify(stats, null, 2));
  console.log(`Stats saved to ${DATA_FILE}`);
}

/**
 * Generate index.html from template with embedded data
 */
function generateHtml(stats) {
  if (!fs.existsSync(TEMPLATE_FILE)) {
    console.warn('Template file not found, skipping HTML generation');
    return;
  }

  const template = fs.readFileSync(TEMPLATE_FILE, 'utf-8');
  const html = template.replace('{{DATA}}', JSON.stringify(stats, null, 2));
  fs.writeFileSync(OUTPUT_HTML, html);
  console.log(`Generated ${OUTPUT_HTML}`);
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();

  // Determine which dates to collect
  let dates;
  if (args.backfill) {
    dates = getBackfillDates(args.backfill);
    console.log(`Backfilling ${args.backfill} days...`);
  } else if (args.date) {
    dates = [args.date];
  } else {
    dates = [getTodayDateStr()];
  }

  const allStats = loadStats();

  // Filter out already-complete days unless --force is used
  let datesToCollect = dates;
  if (!args.force) {
    datesToCollect = dates.filter(d => !isDayComplete(allStats, d));
    const skipped = dates.length - datesToCollect.length;
    if (skipped > 0) {
      console.log(`Skipping ${skipped} already-collected day(s)`);
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

    // Fetch all profiles once (no $createdAt index, so we can't query by date)
    const profilesByDate = await fetchAllProfilesByDate(sdk);
    await new Promise(resolve => setTimeout(resolve, QUERY_DELAY));
    console.log();

    for (const dateStr of datesToCollect) {
      const dayStats = await collectDayStats(sdk, dateStr, profilesByDate);
      allStats.days[dateStr] = dayStats;
      console.log();
    }

    saveStats(allStats);
    generateHtml(allStats);

    // Print summary
    console.log('\n=== Summary ===');
    for (const dateStr of datesToCollect) {
      const day = allStats.days[dateStr];
      if (day) {
        console.log(`${dateStr}: ${day.posts} posts, ${day.newUsers} new users`);
      }
    }

  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

main();
