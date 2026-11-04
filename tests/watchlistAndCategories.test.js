process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/test_stock_app';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { CATEGORY_MAP } = require('../controllers/stockController');
const { listStocksQuerySchema } = require('../lib/stockValidation');
const { formatVolume } = require('../lib/money');

test('CATEGORY_MAP covers all required trading sectors', () => {
  assert.ok(CATEGORY_MAP.banking.includes('Banking'));
  assert.ok(CATEGORY_MAP.it.includes('Information Technology'));
  assert.ok(CATEGORY_MAP.infrastructure.includes('Infrastructure'));
  assert.ok(CATEGORY_MAP.pharma.includes('Pharmaceuticals'));
  assert.ok(CATEGORY_MAP.energy.includes('Energy'));
  assert.ok(CATEGORY_MAP.fmcg.includes('FMCG'));
  assert.ok(CATEGORY_MAP.auto.includes('Automobile'));
});

test('listStocksQuerySchema validates category parameter', () => {
  const result = listStocksQuerySchema.safeParse({ category: 'banking' });
  assert.equal(result.success, true);
  assert.equal(result.data.category, 'banking');
});

test('listStocksQuerySchema validates market parameter for Indian and US stocks', () => {
  assert.equal(listStocksQuerySchema.safeParse({ market: 'IN' }).success, true);
  assert.equal(listStocksQuerySchema.safeParse({ market: 'US' }).success, true);
  assert.equal(listStocksQuerySchema.safeParse({ market: 'all' }).success, true);
  assert.equal(listStocksQuerySchema.safeParse({ market: 'INVALID' }).success, false);
});

test('US_STOCKS contains top US companies with NASDAQ and NYSE exchanges', () => {
  const { US_STOCKS } = require('../scripts/data/usStocks');
  assert.ok(Array.isArray(US_STOCKS));
  assert.ok(US_STOCKS.length >= 10);

  const symbols = US_STOCKS.map((s) => s.symbol);
  assert.ok(symbols.includes('AAPL'));
  assert.ok(symbols.includes('MSFT'));
  assert.ok(symbols.includes('NVDA'));
  assert.ok(symbols.includes('GOOGL'));
  assert.ok(symbols.includes('TSLA'));

  for (const s of US_STOCKS) {
    assert.equal(s.market, 'US');
    assert.equal(s.currency, 'USD');
    assert.ok(s.exchange === 'NASDAQ' || s.exchange === 'NYSE');
  }
});

test('toYahooSymbol correctly distinguishes Indian stocks from US stocks', () => {
  const { toYahooSymbol } = require('../services/market/yahooClient');
  // Indian stocks must use .NS suffix for NSE
  assert.equal(toYahooSymbol('TCS'), 'TCS.NS');
  assert.equal(toYahooSymbol('RELIANCE'), 'RELIANCE.NS');
  assert.equal(toYahooSymbol('INFY'), 'INFY.NS');

  // US stocks must NOT append .NS
  assert.equal(toYahooSymbol('AAPL'), 'AAPL');
  assert.equal(toYahooSymbol('MSFT'), 'MSFT');
  assert.equal(toYahooSymbol('NVDA'), 'NVDA');
  assert.equal(toYahooSymbol('TSLA'), 'TSLA');
  assert.equal(toYahooSymbol('GOOGL'), 'GOOGL');
});

test('formatVolume formats numbers into readable financial amounts', () => {
  assert.equal(formatVolume(25000000), '2.50 Cr');
  assert.equal(formatVolume(450000), '4.50 L');
  assert.equal(formatVolume(15000), '15.0K');
  assert.equal(formatVolume(0), '—');
  assert.equal(formatVolume(null), '—');
});
