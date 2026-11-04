const Stock = require('../../models/Stock');
const PriceHistory = require('../../models/PriceHistory');
const { roundMoney } = require('../../lib/money');
const { TICK_MAX_PERCENT } = require('../../config/trading');
const { isMarketOpen } = require('../../lib/marketStatus');
const { resolveRange } = require('./ranges');
const { publicStockFields, detailStockFields } = require('./stockFields');

function hashString(value) {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRng(seed) {
  let state = seed >>> 0;

  return function next() {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function randomWalkStep(price, rng, maxPercent) {
  const changePercent = (rng() * 2 - 1) * maxPercent;
  const nextPrice = price * (1 + changePercent / 100);
  return Math.max(1, roundMoney(nextPrice));
}

function buildDailySeries(basePrice, rng, now) {
  const points = [];
  const end = startOfUtcDay(now);
  const start = addUtcDays(end, -365);
  let price = basePrice;

  for (let cursor = new Date(start); cursor <= end; cursor = addUtcDays(cursor, 1)) {
    if (isWeekend(cursor)) {
      continue;
    }

    price = randomWalkStep(price, rng, 1.8);
    points.push({ timestamp: new Date(cursor), price });
  }

  return points;
}

function buildIntradaySeries(openPrice, rng, sessionDate) {
  const points = [];
  const sessionStart = new Date(sessionDate);
  sessionStart.setUTCHours(3, 45, 0, 0);

  let price = openPrice;
  let high = openPrice;
  let low = openPrice;

  for (let i = 0; i <= 75; i += 1) {
    if (i > 0) {
      price = randomWalkStep(price, rng, 0.25);
    }

    high = Math.max(high, price);
    low = Math.min(low, price);

    const timestamp = new Date(sessionStart.getTime() + i * 5 * 60 * 1000);
    points.push({ timestamp, price });
  }

  return { points, high, low, last: price };
}

function snapshotFromHistory(dailyPoints, intraday) {
  const lastDaily = dailyPoints[dailyPoints.length - 1];
  const previousDaily = dailyPoints[dailyPoints.length - 2] || lastDaily;
  const yearPrices = dailyPoints.map((point) => point.price);

  return {
    currentPrice: intraday.last,
    previousClose: previousDaily.price,
    dayHigh: roundMoney(intraday.high),
    dayLow: roundMoney(intraday.low),
    week52High: roundMoney(Math.max(...yearPrices, intraday.high)),
    week52Low: roundMoney(Math.min(...yearPrices, intraday.low)),
  };
}

function generateSimulatedHistory(definition, now = new Date()) {
  const rng = createRng(hashString(definition.symbol));
  const dailyPoints = buildDailySeries(definition.basePrice, rng, now);
  const lastDaily = dailyPoints[dailyPoints.length - 1];
  const previousDaily = dailyPoints[dailyPoints.length - 2] || lastDaily;
  const intraday = buildIntradaySeries(previousDaily.price, rng, lastDaily.timestamp);
  const snapshot = snapshotFromHistory(dailyPoints, intraday);

  return { dailyPoints, intradayPoints: intraday.points, snapshot };
}

async function listPublicStocks() {
  const stocks = await Stock.find({})
    .select('symbol companyName currentPrice website')
    .sort({ symbol: 1 })
    .lean();

  return stocks.map(publicStockFields);
}

async function getQuote(symbol) {
  const stock = await Stock.findOne({ symbol: String(symbol).toUpperCase() }).lean();

  if (!stock) {
    return null;
  }

  return detailStockFields(stock);
}

async function getHistory(symbol, rangeKey) {
  const stock = await Stock.findOne({ symbol: String(symbol).toUpperCase() })
    .select('_id symbol currentPrice previousClose')
    .lean();

  if (!stock) {
    return null;
  }

  const range = resolveRange(rangeKey);
  const from = new Date(Date.now() - range.durationMs);

  const points = await PriceHistory.find({
    stock: stock._id,
    interval: range.interval,
    timestamp: { $gte: from },
  })
    .sort({ timestamp: 1 })
    .select('timestamp price -_id')
    .lean();

  const startPrice = points[0]?.price ?? stock.previousClose;
  const endPrice = points[points.length - 1]?.price ?? stock.currentPrice;

  return {
    symbol: stock.symbol,
    range: range.key,
    interval: range.interval,
    isIntraday: range.interval === 'intraday',
    source: 'simulated',
    startPrice,
    endPrice,
    isUp: endPrice >= startPrice,
    points,
  };
}

async function applyRandomTick() {
  const stocks = await Stock.find({});
  const now = new Date();
  const results = [];

  for (const stock of stocks) {
    if (!isMarketOpen(stock.market || 'IN', now)) {
      continue;
    }

    const rng = createRng(hashString(`${stock.symbol}-${now.getTime()}`));
    const nextPrice = randomWalkStep(stock.currentPrice, rng, TICK_MAX_PERCENT);

    stock.currentPrice = nextPrice;
    stock.dayHigh = roundMoney(Math.max(stock.dayHigh, nextPrice));
    stock.dayLow = roundMoney(Math.min(stock.dayLow, nextPrice));
    stock.week52High = roundMoney(Math.max(stock.week52High, nextPrice));
    stock.week52Low = roundMoney(Math.min(stock.week52Low, nextPrice));

    await stock.save();

    await PriceHistory.findOneAndUpdate(
      { stock: stock._id, interval: 'intraday', timestamp: now },
      {
        stock: stock._id,
        symbol: stock.symbol,
        interval: 'intraday',
        timestamp: now,
        price: nextPrice,
      },
      { upsert: true }
    );

    results.push({ symbol: stock.symbol, currentPrice: nextPrice });
  }

  return results;
}

// Simulated prices never go stale, so there is nothing to refresh on read.
async function ensureFresh() {}
async function ensureFreshAll() {}

module.exports = {
  name: 'simulated',
  generateSimulatedHistory,
  listPublicStocks,
  getQuote,
  getHistory,
  applyRandomTick,
  ensureFresh,
  ensureFreshAll,
  refresh: applyRandomTick,
  publicStockFields,
  detailStockFields,
};