/**
 * Live market data provider (real NSE prices via Yahoo Finance).
 *
 * How it fits together
 *  - The Stock collection stays the single source of truth for the latest quote.
 *    Stock lists, portfolio valuation and buy/sell all read currentPrice from it,
 *    so a trade is always priced from the same number the user saw.
 *  - Quotes are refreshed lazily: when something reads them and they are older
 *    than QUOTE_TTL_SECONDS, one shared refresh runs (never one per request).
 *  - Chart candles are fetched on demand and cached in memory per symbol + range.
 *  - If the feed is down the last stored quote is served and upstream calls are
 *    paused briefly instead of making every page wait on a timeout.
 */
const Stock = require('../../models/Stock');
const { httpError } = require('../../lib/apiError');
const { QUOTE_TTL_SECONDS } = require('../../config/trading');
const { needsQuoteRefresh } = require('../../lib/marketStatus');
const { resolveRange } = require('./ranges');
const { publicStockFields, detailStockFields } = require('./stockFields');
const yahoo = require('./yahooClient');

const QUOTE_TTL_MS = QUOTE_TTL_SECONDS * 1000;
const BACKOFF_MS = 15 * 1000;
const SYNC_WAIT_BUDGET_MS = 10 * 1000;
const FETCH_CONCURRENCY = 5;
const MARKET_CAP_REFRESH_MS = 6 * 60 * 60 * 1000;
const MARKET_CAP_RETRY_MS = 15 * 60 * 1000;

let lastSuccessAt = 0;
let backoffUntil = 0;
let marketCapNextAt = 0;
let inflightSync = null;
const inflightSingle = new Map();
const historyCache = new Map();

function isFresh(date, market = 'IN') {
  return !needsQuoteRefresh(date, market, new Date(), { openTtlMs: QUOTE_TTL_MS });
}

function buildQuoteUpdate(stock, snapshot, now) {
  const price = snapshot.currentPrice;
  const knownHigh = snapshot.week52High ?? Math.max(stock.week52High || 0, price);
  const knownLow =
    snapshot.week52Low ?? (stock.week52Low > 0 ? Math.min(stock.week52Low, price) : price);

  return {
    currentPrice: price,
    previousClose: snapshot.previousClose,
    openPrice: snapshot.openPrice || snapshot.previousClose,
    dayHigh: snapshot.dayHigh,
    dayLow: snapshot.dayLow,
    week52High: Math.max(knownHigh, price),
    week52Low: Math.min(knownLow, price),
    volume: snapshot.volume || stock.volume || 0,
    priceTime: snapshot.priceTime || now,
    quoteUpdatedAt: now,
  };
}

async function loadMarketCaps(symbols) {
  if (Date.now() < marketCapNextAt) {
    return new Map();
  }

  try {
    const caps = await yahoo.fetchMarketCaps(symbols);
    marketCapNextAt = Date.now() + MARKET_CAP_REFRESH_MS;
    return caps;
  } catch (error) {
    marketCapNextAt = Date.now() + MARKET_CAP_RETRY_MS;
    console.warn(`[market] market cap refresh skipped: ${error.message}`);
    return new Map();
  }
}

async function runSync(stocksToSync) {
  const stocks =
    stocksToSync ||
    (await Stock.find({}).select('symbol market week52High week52Low volume quoteUpdatedAt').lean());

  const targets = stocks.filter((stock) =>
    needsQuoteRefresh(stock.quoteUpdatedAt, stock.market || 'IN', new Date(), { openTtlMs: QUOTE_TTL_MS })
  );

  if (!targets.length) {
    return { updated: 0, failed: 0, failures: [], skipped: stocks.length };
  }

  const fetched = await yahoo.mapWithConcurrency(targets, FETCH_CONCURRENCY, async (stock) => {
    try {
      return { stock, snapshot: await yahoo.fetchQuoteSnapshot(stock.symbol, stock.market) };
    } catch (error) {
      return { stock, error };
    }
  });

  const succeeded = fetched.filter((item) => item.snapshot);
  const failures = fetched
    .filter((item) => item.error)
    .map((item) => ({ symbol: item.stock.symbol, error: item.error.message }));

  if (!succeeded.length) {
    backoffUntil = Date.now() + BACKOFF_MS;
    console.warn(`[market] quote refresh failed for all ${targets.length} stocks`, failures[0]);
    return { updated: 0, failed: failures.length, failures };
  }

  const now = new Date();
  const marketCaps = await loadMarketCaps(succeeded.map((item) => item.stock.symbol));

  const operations = succeeded.map(({ stock, snapshot }) => {
    const update = buildQuoteUpdate(stock, snapshot, now);
    const marketCap = marketCaps.get(stock.symbol);

    if (marketCap) {
      update.marketCap = marketCap;
    }

    return { updateOne: { filter: { _id: stock._id }, update: { $set: update } } };
  });

  await Stock.bulkWrite(operations, { ordered: false });
  lastSuccessAt = Date.now();

  try {
    const { triggerAllPendingLimitOrders } = require('../../controllers/portfolioController');
    await triggerAllPendingLimitOrders();
  } catch (err) {
    console.warn('[market] limit order check after sync failed:', err.message);
  }

  if (failures.length) {
    console.warn(`[market] ${failures.length} quote(s) failed`, failures.slice(0, 3));
  }

  return { updated: succeeded.length, failed: failures.length, failures };
}

/** Refreshes every stock. Concurrent callers share one run. */
function syncAll({ force = false } = {}) {
  if (Date.now() < backoffUntil) {
    return Promise.resolve(null);
  }

  if (!force && Date.now() - lastSuccessAt < QUOTE_TTL_MS) {
    return Promise.resolve(null);
  }

  if (!inflightSync) {
    inflightSync = runSync().finally(() => {
      inflightSync = null;
    });
  }

  return inflightSync;
}

/** Refreshes one stock if its quote is stale. Concurrent callers for the same symbol share one run. */
async function syncSingle(stock) {
  if (isFresh(stock.quoteUpdatedAt, stock.market || 'IN') || Date.now() < backoffUntil) {
    return stock;
  }

  const symbol = stock.symbol;

  if (!inflightSingle.has(symbol)) {
    const promise = (async () => {
      try {
        const snapshot = await yahoo.fetchQuoteSnapshot(symbol, stock.market);
        const now = new Date();
        const update = buildQuoteUpdate(stock, snapshot, now);

        await Stock.updateOne({ _id: stock._id }, { $set: update });
        const updatedStock = { ...stock, ...update };

        try {
          const { triggerPendingLimitOrdersForStock } = require('../../controllers/portfolioController');
          await triggerPendingLimitOrdersForStock(updatedStock);
        } catch (err) {
          console.warn(`[market] limit order check for ${symbol} failed:`, err.message);
        }

        return updatedStock;
      } catch (error) {
        console.warn(`[market] single quote refresh for ${symbol} failed: ${error.message}`);
        return stock;
      }
    })().finally(() => {
      inflightSingle.delete(symbol);
    });

    inflightSingle.set(symbol, promise);
  }

  return inflightSingle.get(symbol);
}

/**
 * Ensures the quote for a single symbol is fresh. Returns the updated document.
 * Reads are fast: if the feed is down or slow, the stored quote is used once the
 * wait budget expires.
 */
async function ensureFresh(symbol) {
  const stock = await Stock.findOne({ symbol: String(symbol).toUpperCase() }).lean();

  if (!stock) {
    return null;
  }

  if (isFresh(stock.quoteUpdatedAt, stock.market || 'IN')) {
    return stock;
  }

  const race = Promise.race([
    syncSingle(stock),
    new Promise((resolve) => setTimeout(() => resolve(stock), SYNC_WAIT_BUDGET_MS)),
  ]);

  return race;
}

/** Refreshes quotes that are stale for the current session (open TTL vs post-close catch-up). */
async function ensureFreshAll() {
  await syncAll({ force: true });
}

async function getQuote(symbol) {
  const stock = await ensureFresh(symbol);
  return stock ? detailStockFields(stock) : null;
}

async function loadCandles(symbol, range, market) {
  const cacheKey = `${symbol}|${range.key}`;
  const cached = historyCache.get(cacheKey);

  if (cached && Date.now() - cached.at < range.cacheTtlMs) {
    return cached.candles;
  }

  if (Date.now() < backoffUntil && cached) {
    return cached.candles;
  }

  try {
    const candles = await yahoo.fetchCandles(symbol, range.yahoo, market);
    historyCache.set(cacheKey, { at: Date.now(), candles });
    return candles;
  } catch (error) {
    if (error.code !== 'FEED_NOT_FOUND') {
      backoffUntil = Date.now() + BACKOFF_MS;
    }

    console.warn(`[market] ${symbol} history (${range.key}) failed: ${error.message}`);

    if (cached) {
      return cached.candles;
    }

    throw httpError('Chart data is temporarily unavailable. Please try again shortly.', 502);
  }
}

async function getHistory(symbol, rangeKey) {
  const key = String(symbol).toUpperCase();
  const stock = await Stock.findOne({ symbol: key }).select('symbol previousClose market').lean();

  if (!stock) {
    return null;
  }

  const range = resolveRange(rangeKey);
  const candles = await loadCandles(key, range, stock.market);
  const isIntraday = range.yahoo.interval.endsWith('m');

  // A one-day chart is coloured against yesterday's close, like exchange charts.
  const startPrice =
    range.key === '1d' && stock.previousClose ? stock.previousClose : candles[0].open;
  const endPrice = candles[candles.length - 1].close;

  return {
    symbol: stock.symbol,
    range: range.key,
    interval: range.yahoo.interval,
    isIntraday,
    source: 'yahoo',
    startPrice,
    endPrice,
    isUp: endPrice >= startPrice,
    points: candles.map((candle) => ({
      timestamp: new Date(candle.time).toISOString(),
      price: candle.close,
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      volume: candle.volume,
    })),
  };
}

function resetForTests() {
  lastSuccessAt = 0;
  backoffUntil = 0;
  marketCapNextAt = 0;
  inflightSync = null;
  inflightSingle.clear();
  historyCache.clear();
}

module.exports = {
  name: 'yahoo',
  getQuote,
  getHistory,
  ensureFresh,
  ensureFreshAll,
  refresh: () => syncAll({ force: true }),
  publicStockFields,
  detailStockFields,
  resetForTests,
};
