const connectDB = require('../config/db');
const Watchlist = require('../models/Watchlist');
const Stock = require('../models/Stock');
const { getMarketDataProvider } = require('../services/market');
const { getLogoUrl } = require('../lib/stockLogo');
const { roundMoney } = require('../lib/money');
const { httpError } = require('../lib/apiError');

async function getWatchlist(userId) {
  await connectDB();
  await getMarketDataProvider().ensureFreshAll();

  const entries = await Watchlist.find({ user: userId }).sort({ createdAt: -1 }).lean();
  const symbols = entries.map((e) => e.symbol);

  if (!symbols.length) {
    return { watchlist: [], symbols: [] };
  }

  const stocks = await Stock.find({ symbol: { $in: symbols } }).lean();
  const stockMap = new Map(stocks.map((s) => [s.symbol, s]));

  const rows = [];
  for (const sym of symbols) {
    const stock = stockMap.get(sym);
    if (!stock) continue;

    const changeAmount = roundMoney(stock.currentPrice - stock.previousClose);
    const changePercent = stock.previousClose
      ? roundMoney((changeAmount / stock.previousClose) * 100)
      : 0;

    const market = stock.market || 'IN';
    const exchange = stock.exchange || (market === 'US' ? 'NASDAQ' : 'NSE');
    const currency = stock.currency || (market === 'US' ? 'USD' : 'INR');

    rows.push({
      symbol: stock.symbol,
      companyName: stock.companyName,
      sector: stock.sector,
      market,
      exchange,
      currency,
      logoUrl: getLogoUrl(stock.website, stock.symbol),
      currentPrice: stock.currentPrice,
      previousClose: stock.previousClose,
      changeAmount,
      changePercent,
      dayHigh: stock.dayHigh,
      dayLow: stock.dayLow,
      marketCap: stock.marketCap,
      volume: stock.volume || 0,
    });
  }

  return { watchlist: rows, symbols };
}

async function getWatchlistSymbols(userId) {
  await connectDB();
  const entries = await Watchlist.find({ user: userId }).select('symbol').lean();
  return entries.map((e) => e.symbol);
}

async function toggleWatchlist(userId, symbol) {
  await connectDB();
  const normSymbol = String(symbol || '').trim().toUpperCase();

  if (!normSymbol) {
    throw httpError('Stock symbol is required', 400);
  }

  // Ensure stock exists in database
  const stockExists = await Stock.exists({ symbol: normSymbol });
  if (!stockExists) {
    throw httpError('Stock symbol not found', 404);
  }

  const existing = await Watchlist.findOne({ user: userId, symbol: normSymbol });

  if (existing) {
    await Watchlist.deleteOne({ _id: existing._id });
    const symbols = await getWatchlistSymbols(userId);
    return { watched: false, symbol: normSymbol, symbols };
  } else {
    await Watchlist.create({ user: userId, symbol: normSymbol });
    const symbols = await getWatchlistSymbols(userId);
    return { watched: true, symbol: normSymbol, symbols };
  }
}

async function addToWatchlist(userId, symbol) {
  await connectDB();
  const normSymbol = String(symbol || '').trim().toUpperCase();

  if (!normSymbol) {
    throw httpError('Stock symbol is required', 400);
  }

  await Watchlist.updateOne(
    { user: userId, symbol: normSymbol },
    { $setOnInsert: { user: userId, symbol: normSymbol } },
    { upsert: true }
  );

  const symbols = await getWatchlistSymbols(userId);
  return { watched: true, symbol: normSymbol, symbols };
}

async function removeFromWatchlist(userId, symbol) {
  await connectDB();
  const normSymbol = String(symbol || '').trim().toUpperCase();

  if (!normSymbol) {
    throw httpError('Stock symbol is required', 400);
  }

  await Watchlist.deleteOne({ user: userId, symbol: normSymbol });
  const symbols = await getWatchlistSymbols(userId);
  return { watched: false, symbol: normSymbol, symbols };
}

module.exports = {
  getWatchlist,
  getWatchlistSymbols,
  toggleWatchlist,
  addToWatchlist,
  removeFromWatchlist,
};
