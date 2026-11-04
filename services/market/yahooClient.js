/**
 * Thin client for Yahoo Finance's public endpoints (NSE symbols use the ".NS" suffix).
 *
 * This file has no database dependency so it can be unit-tested with a stubbed
 * global fetch. It is NOT an official, contractual API: Yahoo may rate-limit or
 * change it. The provider above this layer caches results and falls back to the
 * last stored quote when the feed is unavailable.
 */
const { roundMoney } = require('../../lib/money');
const { US_STOCKS } = require('../../scripts/data/usStocks');

const US_SYMBOLS = new Set(US_STOCKS.map((s) => s.symbol.toUpperCase()));

const HOSTS = ['https://query1.finance.yahoo.com', 'https://query2.finance.yahoo.com'];
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const REQUEST_TIMEOUT_MS = 5000;
const CRUMB_TTL_MS = 6 * 60 * 60 * 1000;

function feedError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function toYahooSymbol(symbol, market) {
  const clean = String(symbol).trim().toUpperCase();
  if (market === 'US' || US_SYMBOLS.has(clean) || clean.includes('.')) {
    return clean;
  }
  return `${clean}.NS`;
}

function fromYahooSymbol(yahooSymbol) {
  return String(yahooSymbol).toUpperCase().replace(/\.NS$/, '');
}

function toNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function requestJson(path, extraHeaders = {}) {
  let lastError;

  for (const host of HOSTS) {
    try {
      const response = await fetch(`${host}${path}`, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...extraHeaders },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: 'no-store',
      });

      if (response.status === 404) {
        // A missing symbol will be missing on every host, so do not retry.
        throw feedError('Symbol not found on the market feed', 'FEED_NOT_FOUND');
      }

      if (!response.ok) {
        throw feedError(`Market feed responded with ${response.status}`, 'FEED_HTTP');
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (error.code === 'FEED_NOT_FOUND') {
        break;
      }
    }
  }

  throw lastError;
}

/**
 * Turns a Yahoo "chart" payload into clean candles + a few meta values.
 * Candles with missing values (Yahoo returns nulls for halted/empty bars) are dropped.
 */
function parseChartResponse(json) {
  const chart = json && json.chart;
  const result = chart && Array.isArray(chart.result) ? chart.result[0] : null;

  if (!result) {
    throw feedError(
      (chart && chart.error && chart.error.description) || 'The market feed returned no data',
      'FEED_NO_DATA'
    );
  }

  const meta = result.meta || {};
  const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
  const quote = (result.indicators && result.indicators.quote && result.indicators.quote[0]) || {};
  const candles = [];

  for (let i = 0; i < timestamps.length; i += 1) {
    const open = toNumber(quote.open && quote.open[i]);
    const high = toNumber(quote.high && quote.high[i]);
    const low = toNumber(quote.low && quote.low[i]);
    const close = toNumber(quote.close && quote.close[i]);

    if (open === null || high === null || low === null || close === null) {
      continue;
    }

    candles.push({
      time: timestamps[i] * 1000,
      open: roundMoney(open),
      high: roundMoney(high),
      low: roundMoney(low),
      close: roundMoney(close),
      volume: toNumber(quote.volume && quote.volume[i]) || 0,
    });
  }

  candles.sort((a, b) => a.time - b.time);

  return {
    meta: {
      price: toNumber(meta.regularMarketPrice),
      chartPreviousClose: toNumber(meta.chartPreviousClose),
      dayHigh: toNumber(meta.regularMarketDayHigh),
      dayLow: toNumber(meta.regularMarketDayLow),
      week52High: toNumber(meta.fiftyTwoWeekHigh),
      week52Low: toNumber(meta.fiftyTwoWeekLow),
      volume: toNumber(meta.regularMarketVolume),
      priceTime: toNumber(meta.regularMarketTime),
      currency: meta.currency || null,
    },
    candles,
  };
}

/**
 * Builds the quote we store on a Stock from a 5-day daily chart.
 * Previous close is the close of the session before the latest one, which is
 * what exchanges and Yahoo show as "previous close".
 */
function buildSnapshot({ meta, candles }) {
  const last = candles[candles.length - 1] || null;
  const previous = candles.length >= 2 ? candles[candles.length - 2] : null;
  const price = meta.price !== null ? meta.price : last && last.close;

  if (!Number.isFinite(price) || price <= 0) {
    throw feedError('The market feed returned no valid price', 'FEED_NO_DATA');
  }

  const previousClose =
    (previous && previous.close) || meta.chartPreviousClose || (last && last.open) || price;
  const dayHigh = meta.dayHigh !== null ? meta.dayHigh : last ? last.high : price;
  const dayLow = meta.dayLow !== null ? meta.dayLow : last ? last.low : price;
  const volume = (meta && meta.volume) || (last && last.volume) || 0;
  const openPrice = (last && last.open) || previousClose;

  return {
    currentPrice: roundMoney(price),
    previousClose: roundMoney(previousClose),
    openPrice: roundMoney(openPrice),
    dayHigh: roundMoney(Math.max(dayHigh, price)),
    dayLow: roundMoney(Math.min(dayLow, price)),
    week52High: meta.week52High !== null ? roundMoney(meta.week52High) : null,
    week52Low: meta.week52Low !== null ? roundMoney(meta.week52Low) : null,
    volume,
    priceTime: meta.priceTime !== null ? new Date(meta.priceTime * 1000) : null,
  };
}

async function fetchChart(symbol, { range, interval }, market) {
  const path =
    `/v8/finance/chart/${encodeURIComponent(toYahooSymbol(symbol, market))}` +
    `?range=${range}&interval=${interval}&includePrePost=false`;

  return parseChartResponse(await requestJson(path));
}

async function fetchQuoteSnapshot(symbol, market) {
  return buildSnapshot(await fetchChart(symbol, { range: '5d', interval: '1d' }, market));
}

async function fetchCandles(symbol, { range, interval }, market) {
  const { candles } = await fetchChart(symbol, { range, interval }, market);

  if (!candles.length) {
    throw feedError('The market feed returned no candles for this range', 'FEED_NO_DATA');
  }

  return candles;
}

/* ----- Market cap (batch quote endpoint, needs a session cookie + crumb) ----- */

let crumbCache = null;

async function getCrumb() {
  if (crumbCache && Date.now() - crumbCache.at < CRUMB_TTL_MS) {
    return crumbCache;
  }

  const cookieResponse = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': USER_AGENT },
    redirect: 'manual',
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const setCookies =
    typeof cookieResponse.headers.getSetCookie === 'function'
      ? cookieResponse.headers.getSetCookie()
      : [];
  const cookie = setCookies.map((value) => value.split(';')[0]).join('; ');

  if (!cookie) {
    throw feedError('Could not start a market feed session', 'FEED_SESSION');
  }

  const crumbResponse = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: { 'User-Agent': USER_AGENT, Cookie: cookie },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const crumb = (await crumbResponse.text()).trim();

  if (!crumbResponse.ok || !crumb || crumb.length > 64 || /[<\s]/.test(crumb)) {
    throw feedError('Could not obtain a market feed crumb', 'FEED_SESSION');
  }

  crumbCache = { crumb, cookie, at: Date.now() };
  return crumbCache;
}

function parseQuoteResponse(json) {
  const items = (json && json.quoteResponse && json.quoteResponse.result) || [];
  const marketCaps = new Map();

  for (const item of items) {
    const cap = toNumber(item && item.marketCap);

    if (item && item.symbol && cap !== null && cap > 0) {
      marketCaps.set(fromYahooSymbol(item.symbol), cap);
    }
  }

  return marketCaps;
}

/** Returns Map<SYMBOL, marketCap>. Throws if the session/crumb flow fails. */
async function fetchMarketCaps(symbols) {
  if (!symbols.length) {
    return new Map();
  }

  const { crumb, cookie } = await getCrumb();
  const list = symbols.map(toYahooSymbol).join(',');
  const path =
    `/v7/finance/quote?symbols=${encodeURIComponent(list)}` +
    `&fields=marketCap&crumb=${encodeURIComponent(crumb)}`;

  try {
    return parseQuoteResponse(await requestJson(path, { Cookie: cookie }));
  } catch (error) {
    crumbCache = null;
    throw error;
  }
}

async function mapWithConcurrency(items, limit, worker) {
  const results = new Array(items.length);
  let next = 0;

  async function run() {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await worker(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

function resetCrumbCache() {
  crumbCache = null;
}

module.exports = {
  toYahooSymbol,
  fromYahooSymbol,
  parseChartResponse,
  buildSnapshot,
  parseQuoteResponse,
  fetchQuoteSnapshot,
  fetchCandles,
  fetchMarketCaps,
  mapWithConcurrency,
  resetCrumbCache,
};
