const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connectDB = require('../config/db');
const Stock = require('../models/Stock');
const PriceHistory = require('../models/PriceHistory');
const { MARKET_DATA_PROVIDER } = require('../config/trading');
const { INDIAN_STOCKS } = require('./data/indianStocks');
const { US_STOCKS } = require('./data/usStocks');
const { generateSimulatedHistory } = require('../services/market/simulatedProvider');
const yahoo = require('../services/market/yahooClient');
const { getLogoUrl } = require('../lib/stockLogo');

function toHistoryDocs(stock, points, interval) {
  return points.map((point) => ({
    stock: stock._id,
    symbol: stock.symbol,
    timestamp: point.timestamp,
    price: point.price,
    interval,
  }));
}

/** Offline development data (random walk). Never used with the live provider. */
async function seedSimulated() {
  const now = new Date();
  let seeded = 0;

  const allDefinitions = [
    ...INDIAN_STOCKS.map((s) => ({ ...s, market: 'IN', exchange: 'NSE', currency: 'INR' })),
    ...US_STOCKS.map((s) => ({ ...s, market: 'US', exchange: s.exchange || 'NASDAQ', currency: 'USD' })),
  ];

  for (const definition of allDefinitions) {
    const { dailyPoints, intradayPoints, snapshot } = generateSimulatedHistory(definition, now);

    const stock = await Stock.findOneAndUpdate(
      { symbol: definition.symbol },
      {
        symbol: definition.symbol,
        companyName: definition.companyName,
        sector: definition.sector,
        market: definition.market,
        exchange: definition.exchange,
        currency: definition.currency,
        description: definition.description,
        website: definition.website,
        logoUrl: getLogoUrl(definition.website, definition.symbol),
        marketCap: definition.marketCap,
        ...snapshot,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await PriceHistory.deleteMany({ stock: stock._id });
    await PriceHistory.insertMany(
      [...toHistoryDocs(stock, dailyPoints, 'daily'), ...toHistoryDocs(stock, intradayPoints, 'intraday')],
      { ordered: false }
    );

    seeded += 1;
    const currSym = definition.currency === 'USD' ? '$' : '₹';
    console.log(`Seeded ${stock.symbol} (${definition.market}) @ ${currSym}${stock.currentPrice} (simulated)`);
  }

  console.log(`Done. ${seeded} stocks seeded with SIMULATED data.`);
  return { seeded, failed: [] };
}

/** Real live data. Both Indian and US stocks dynamically fetched from Yahoo Finance. */
async function seedLive() {
  const allDefinitions = [
    ...INDIAN_STOCKS.map((s) => ({ ...s, market: 'IN', exchange: 'NSE', currency: 'INR' })),
    ...US_STOCKS.map((s) => ({ ...s, market: 'US', exchange: s.exchange || 'NASDAQ', currency: 'USD' })),
  ];

  let marketCaps = new Map();

  try {
    marketCaps = await yahoo.fetchMarketCaps(allDefinitions.map((item) => item.symbol));
  } catch (error) {
    console.warn(`Market cap lookup skipped (${error.message}). Market cap shows "—" until it succeeds.`);
  }

  const now = new Date();
  const failed = [];
  let seeded = 0;

  for (const definition of allDefinitions) {
    let snapshot;

    try {
      snapshot = await yahoo.fetchQuoteSnapshot(definition.symbol, definition.market);
    } catch (error) {
      failed.push({ symbol: definition.symbol, error: error.message });
      console.warn(`Skipped ${definition.symbol}: ${error.message}`);
      continue;
    }

    const existing = await Stock.findOne({ symbol: definition.symbol }).select('marketCap quoteUpdatedAt').lean();
    const liveCap = marketCaps.get(definition.symbol);
    const marketCap = liveCap || (existing && existing.quoteUpdatedAt ? existing.marketCap : definition.marketCap || 0);

    const stock = await Stock.findOneAndUpdate(
      { symbol: definition.symbol },
      {
        symbol: definition.symbol,
        companyName: definition.companyName,
        sector: definition.sector,
        market: definition.market,
        exchange: definition.exchange,
        currency: definition.currency,
        description: definition.description,
        website: definition.website,
        logoUrl: getLogoUrl(definition.website, definition.symbol),
        marketCap,
        currentPrice: snapshot.currentPrice,
        previousClose: snapshot.previousClose,
        dayHigh: snapshot.dayHigh,
        dayLow: snapshot.dayLow,
        week52High: snapshot.week52High ?? snapshot.currentPrice,
        week52Low: snapshot.week52Low ?? snapshot.currentPrice,
        priceTime: snapshot.priceTime || now,
        quoteUpdatedAt: now,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await PriceHistory.deleteMany({ stock: stock._id });

    seeded += 1;
    const currSym = definition.currency === 'USD' ? '$' : '₹';
    console.log(`Seeded ${stock.symbol} (${definition.market}) @ ${currSym}${stock.currentPrice} (live)`);
  }

  console.log(`Done. ${seeded} stocks seeded with LIVE data${failed.length ? `, ${failed.length} skipped` : ''}.`);
  return { seeded, failed };
}

async function seedStocks() {
  await connectDB();

  const live = String(MARKET_DATA_PROVIDER).toLowerCase() !== 'simulated';
  console.log(`Seeding stocks with the "${live ? 'yahoo' : 'simulated'}" provider...`);

  const { seeded, failed } = live ? await seedLive() : await seedSimulated();

  if (live && seeded === 0) {
    console.error('No live quotes could be fetched. Check your internet connection and try again.');
    process.exit(1);
  }

  process.exit(failed.length ? 2 : 0);
}

seedStocks().catch((error) => {
  console.error('Stock seed failed:', error);
  process.exit(1);
});
