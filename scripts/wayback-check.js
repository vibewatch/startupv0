#!/usr/bin/env node

const DEFAULT_URLS = [
  'https://openai.com/',
  'https://platform.openai.com/',
  'https://openai.com/blog/',
  'https://openai.com/research/',
  'https://chat.openai.com/',
];

function formatTimestamp(timestamp) {
  if (!/^\d{14}$/.test(timestamp)) {
    return timestamp;
  }

  const year = timestamp.slice(0, 4);
  const month = timestamp.slice(4, 6);
  const day = timestamp.slice(6, 8);
  const hour = timestamp.slice(8, 10);
  const minute = timestamp.slice(10, 12);
  const second = timestamp.slice(12, 14);
  return `${year}-${month}-${day} ${hour}:${minute}:${second} UTC`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function latestSnapshot(url, { retries = 3, timeoutMs = 20_000 } = {}) {
  const params = new URLSearchParams({
    url,
    output: 'json',
    fl: 'timestamp,original,statuscode,mimetype',
    filter: 'statuscode:200',
    limit: '1',
    from: '1996',
    collapse: 'digest',
    sort: 'reverse',
  });

  const endpoint = `https://web.archive.org/cdx/search/cdx?${params.toString()}`;
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          accept: 'application/json',
          'user-agent': 'startupv2-wayback-check/1.0',
        },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length <= 1) {
        return { url, archived: false };
      }

      const [timestamp, original, status, mimetype] = data[1];
      return {
        url,
        archived: true,
        timestamp,
        timestampHuman: formatTimestamp(timestamp),
        status,
        mimetype,
        snapshot: `https://web.archive.org/web/${timestamp}/${original}`,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < retries) {
        await sleep(1_000 * attempt);
      }
    }
  }

  return { url, error: lastError ?? 'Unknown error' };
}

function printResults(results) {
  for (const result of results) {
    console.log(result.url);

    if (result.archived) {
      console.log('  archived: yes');
      console.log(`  latest:   ${result.timestampHuman}`);
      console.log(`  status:   ${result.status}`);
      console.log(`  type:     ${result.mimetype}`);
      console.log(`  snapshot: ${result.snapshot}`);
    } else if (result.error) {
      console.log(`  error:    ${result.error}`);
    } else {
      console.log('  archived: no');
    }

    console.log('');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const urls = args.filter((arg) => arg !== '--json');
  const targets = urls.length > 0 ? urls : DEFAULT_URLS;

  const results = [];
  for (const url of targets) {
    results.push(await latestSnapshot(url));
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  printResults(results);
}

await main();
