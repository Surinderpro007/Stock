/**
 * Live Forex Exchange Rate Service.
 *
 * Dynamically fetches the real-time USD/INR exchange rate from live market APIs:
 *  1. Yahoo Finance forex quote for USDINR=X (primary real-time market quote)
 *  2. Public Open Exchange Rates API (https://open.er-api.com/v6/latest/USD) as fallback
 *
 * Results are cached in memory with a short TTL (60 seconds) to ensure real-time accuracy
 * without flooding the upstream endpoints.
 */

const FOREX_TTL_MS = 60 * 1000; // 60 seconds
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

let cachedForex = {
  rate: 88.65, // Standard baseline fallback if network is completely offline/sandboxed
  source: 'fallback',
  updatedAt: new Date(),
};

let inflightFetch = null;

async function fetchFromYahoo() {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/USDINR=X?range=1d&interval=5m';
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(4000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Yahoo forex returned status ${response.status}`);
  }

  const json = await response.json();
  const meta = json?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice || meta?.price;

  if (typeof price === 'number' && Number.isFinite(price) && price > 0) {
    return Number(price.toFixed(4));
  }

  throw new Error('Yahoo forex payload had no valid rate');
}

async function fetchFromOpenEr() {
  const url = 'https://open.er-api.com/v6/latest/USD';
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
    signal: AbortSignal.timeout(4000),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`OpenER returned status ${response.status}`);
  }

  const json = await response.json();
  const rate = json?.rates?.INR;

  if (typeof rate === 'number' && Number.isFinite(rate) && rate > 0) {
    return Number(rate.toFixed(4));
  }

  throw new Error('OpenER payload had no valid INR rate');
}

async function refreshRate() {
  // Try Yahoo Finance first
  try {
    const rate = await fetchFromYahoo();
    cachedForex = {
      rate,
      source: 'Yahoo Finance (USDINR=X)',
      updatedAt: new Date(),
    };
    return cachedForex;
  } catch (yahooErr) {
    // Try OpenER fallback
    try {
      const rate = await fetchFromOpenEr();
      cachedForex = {
        rate,
        source: 'Open Exchange Rates',
        updatedAt: new Date(),
      };
      return cachedForex;
    } catch (erErr) {
      console.warn(`[forex] rate refresh skipped: ${yahooErr.message} / ${erErr.message}`);
      return cachedForex;
    }
  }
}

/**
 * Returns the current USD to INR exchange rate.
 * Example return: { rate: 88.65, source: 'Yahoo Finance (USDINR=X)', updatedAt: Date }
 */
async function getUsdInrRate(force = false) {
  const isFresh = Date.now() - new Date(cachedForex.updatedAt).getTime() < FOREX_TTL_MS;

  if (!force && isFresh && cachedForex.source !== 'fallback') {
    return cachedForex;
  }

  if (!inflightFetch) {
    inflightFetch = refreshRate().finally(() => {
      inflightFetch = null;
    });
  }

  return inflightFetch;
}

module.exports = {
  getUsdInrRate,
};
