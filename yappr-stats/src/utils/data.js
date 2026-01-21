/**
 * Data loading and caching utilities
 */

let indexData = null;
const dayCache = new Map();
const userLookup = new Map(); // ownerId -> displayName

/**
 * Load the index file (summary data)
 */
export async function loadIndex() {
  if (indexData) {
    return indexData;
  }

  const res = await fetch('./data/index.json');
  if (!res.ok) {
    throw new Error(`Failed to load index: ${res.status}`);
  }

  indexData = await res.json();
  return indexData;
}

/**
 * Load data for a specific day (lazy loaded and cached)
 */
export async function loadDay(date) {
  if (dayCache.has(date)) {
    return dayCache.get(date);
  }

  const res = await fetch(`./data/${date}.json`);
  if (!res.ok) {
    throw new Error(`Failed to load day ${date}: ${res.status}`);
  }

  const data = await res.json();
  dayCache.set(date, data);

  // Build user lookup from users in this day
  if (data.users) {
    for (const user of data.users) {
      if (user.displayName && user.ownerId) {
        userLookup.set(user.ownerId, user.displayName);
      }
    }
  }

  return data;
}

/**
 * Get display name for an owner ID (returns null if not found)
 */
export function getUserDisplayName(ownerId) {
  return userLookup.get(ownerId) || null;
}

/**
 * Get sorted array of dates from index (newest first)
 */
export function getSortedDates(index) {
  return index.days.map(d => d.date).sort((a, b) => b.localeCompare(a));
}

/**
 * Get day summary from index by date
 */
export function getDaySummary(index, date) {
  return index.days.find(d => d.date === date);
}

/**
 * Clear the data cache (useful for refreshing)
 */
export function clearCache() {
  indexData = null;
  dayCache.clear();
  userLookup.clear();
}

/**
 * Preload all days to build the complete user lookup
 * This ensures profile names are available for all posts
 */
export async function preloadAllDays(index) {
  const dates = index.days.map(d => d.date);
  await Promise.all(dates.map(date => loadDay(date)));
}
