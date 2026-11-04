const connectDB = require('../config/db');
const Stock = require('../models/Stock');
const { getMarketDataProvider } = require('../services/market');
const { roundMoney } = require('../lib/money');
const { httpError } = require('../lib/apiError');

const CATEGORY_MAP = {
  banking: ['Banking', 'Financial Services'],
  it: ['Information Technology'],
  infrastructure: ['Infrastructure', 'Materials'],
  pharma: ['Pharmaceuticals'],
  energy: ['Energy'],
  fmcg: ['FMCG'],
  auto: ['Automobile'],
  telecom: ['Telecom'],
  consumer: ['Consumer Durables'],
};

function listFields(stock, includeChange) {
  const provider = getMarketDataProvider();
  const market = stock.market || 'IN';
  const exchange = stock.exchange || (market === 'US' ? 'NASDAQ' : 'NSE');
  const currency = stock.currency || (market === 'US' ? 'USD' : 'INR');

  if (!includeChange) {
    const base = provider.publicStockFields(stock);
    return {
      ...base,
      sector: stock.sector,
      market,
      exchange,
      currency,
    };
  }

  const detail = provider.detailStockFields(stock);

  return {
    symbol: detail.symbol,
    companyName: detail.companyName,
    sector: stock.sector || detail.sector,
    market,
    exchange,
    currency,
    currentPrice: detail.currentPrice,
    logoUrl: detail.logoUrl,
    previousClose: detail.previousClose,
    changeAmount: detail.changeAmount,
    changePercent: detail.changePercent,
    volume: stock.volume || detail.volume || 0,
    priceTime: detail.priceTime,
    quoteUpdatedAt: detail.quoteUpdatedAt,
  };
}

function changeValue(stock) {
  return roundMoney(stock.currentPrice - stock.previousClose);
}

let catalogEnsured = false;

async function ensureStockCatalog() {
  if (catalogEnsured) return;
  try {
    // 1. Backfill any Indian stocks that didn't have market set
    await Stock.updateMany(
      { market: { $exists: false } },
      { $set: { market: 'IN', exchange: 'NSE', currency: 'INR' } }
    );

    // 2. Ensure US stocks are present in the collection
    const usCount = await Stock.countDocuments({ market: 'US' });
    if (usCount === 0) {
      const { US_STOCKS } = require('../scripts/data/usStocks');
      const { getLogoUrl } = require('../lib/stockLogo');
      const now = new Date();

      for (const def of US_STOCKS) {
        await Stock.findOneAndUpdate(
          { symbol: def.symbol },
          {
            symbol: def.symbol,
            companyName: def.companyName,
            sector: def.sector,
            market: 'US',
            exchange: def.exchange || 'NASDAQ',
            currency: 'USD',
            description: def.description,
            website: def.website,
            logoUrl: getLogoUrl(def.website, def.symbol),
            currentPrice: def.basePrice,
            previousClose: def.basePrice,
            openPrice: def.basePrice,
            dayHigh: def.basePrice,
            dayLow: def.basePrice,
            week52High: def.basePrice * 1.25,
            week52Low: def.basePrice * 0.8,
            marketCap: def.marketCap,
            volume: 5000000,
            priceTime: now,
            quoteUpdatedAt: new Date(0), // Set as epoch so ensureFreshAll refreshes it live
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
    catalogEnsured = true;
  } catch (err) {
    console.warn('Failed to ensure stock catalog:', err.message);
  }
}

async function listStocks({
  q = '',
  category = '',
  market = '',
  sortBy = 'symbol',
  order = 'asc',
  limit,
  includeChange = false,
}) {
  await connectDB();
  await ensureStockCatalog();
  await getMarketDataProvider().ensureFreshAll();

  const conditions = [];

  if (market && market.toLowerCase() !== 'all') {
    const m = market.toUpperCase();
    if (m === 'IN') {
      conditions.push({
        $or: [{ market: 'IN' }, { market: { $exists: false } }, { market: null }],
      });
    } else {
      conditions.push({ market: m });
    }
  }

  if (q) {
    conditions.push({
      $or: [
        { symbol: { $regex: q, $options: 'i' } },
        { companyName: { $regex: q, $options: 'i' } },
      ],
    });
  }

  if (category && category.toLowerCase() !== 'all') {
    const catLower = category.toLowerCase().trim();
    const mapped = CATEGORY_MAP[catLower];
    if (mapped) {
      conditions.push({ sector: { $in: mapped } });
    } else {
      conditions.push({ sector: { $regex: category, $options: 'i' } });
    }
  }

  const filter = conditions.length > 0 ? { $and: conditions } : {};

  const sortField = {
    symbol: 'symbol',
    name: 'companyName',
    price: 'currentPrice',
  }[sortBy];

  let stocks = await Stock.find(filter)
    .select('symbol companyName sector market exchange currency currentPrice previousClose website volume openPrice priceTime quoteUpdatedAt')
    .lean();

  if (sortField) {
    const direction = order === 'desc' ? -1 : 1;
    stocks.sort((a, b) => {
      const left = a[sortField];
      const right = b[sortField];
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }
      return String(left).localeCompare(String(right)) * direction;
    });
  } else if (sortBy === 'change') {
    const direction = order === 'desc' ? -1 : 1;
    stocks.sort((a, b) => (changeValue(a) - changeValue(b)) * direction);
  }

  if (limit) {
    stocks = stocks.slice(0, limit);
  }

  return stocks.map((stock) => listFields(stock, includeChange));
}

async function getStockDetail(symbol) {
  await connectDB();
  await ensureStockCatalog();

  const provider = getMarketDataProvider();
  const stock = await provider.getQuote(symbol);

  if (!stock) {
    throw httpError('Stock not found', 404);
  }

  return stock;
}

async function getStockHistory(symbol, range) {
  await connectDB();
  await ensureStockCatalog();

  const provider = getMarketDataProvider();
  const history = await provider.getHistory(symbol, range);

  if (!history) {
    throw httpError('Stock not found', 404);
  }

  return history;
}

module.exports = {
  listStocks,
  getStockDetail,
  getStockHistory,
  CATEGORY_MAP,
};
