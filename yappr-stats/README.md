# Yappr Daily Statistics Collector

A standalone script that collects daily platform-wide activity statistics from the Yappr social platform on Dash Platform.

## Metrics Tracked

- **Posts**: Total new posts created per day
- **New Users**: Total new user profiles created per day

## Setup

```bash
cd yappr-stats
npm install
```

## Usage

### Collect stats for today

```bash
npm run collect
# or
node collect-stats.js
```

### Collect stats for a specific date

```bash
node collect-stats.js --date 2026-01-15
```

### Backfill last N days

```bash
npm run collect:backfill
# or
node collect-stats.js --backfill 30
```

### Force refresh existing data

By default, the script skips days that have already been collected (after the day ended). Use `--force` to recollect:

```bash
node collect-stats.js --backfill 10 --force
node collect-stats.js --date 2026-01-15 --force
```

## Visualization

The collector automatically generates `index.html` with embedded data. Open it directly in your browser:

```bash
open index.html
```

No server required - the data is embedded in the HTML file.

## Output

Stats are saved to `data/daily-stats.json`:

```json
{
  "lastUpdated": "2026-01-20T12:00:00Z",
  "contractId": "AyWK6nDVfb8d1ZmkM5MmZZrThbUyWyso1aMeGuuVSfxf",
  "days": {
    "2026-01-20": {
      "posts": 42,
      "newUsers": 5,
      "collectedAt": "2026-01-20T23:00:00Z"
    }
  }
}
```

## Notes

- All timestamps are in UTC
- Past days are only collected once (skipped on subsequent runs unless `--force` is used)
- Today's stats are always recollected (day not yet complete)
- The script includes rate limiting (500ms between queries) to avoid overwhelming DAPI
- Maximum of 100,000 documents per metric per day (safety limit)
