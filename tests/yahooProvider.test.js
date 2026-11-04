const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');

/* The provider is tested against an in-memory Stock model, so no database is needed. */

const stocks = new Map();
const calls = { bulkWrite: 0, updateOne: 0 };

function query(resolveValue) {
  const chain = {
    select: () => chain,
    lean: () => chain,
    then: (resolve, reject) => Promise.resolve(resolveValue()).then(resolve, reject),
  };
  return chain;
}

const FakeStock = {
  find: () => query(() => [...stocks.values()].map((stock) => ({ ...stock }))),
  findOne: (filter) => query(() => {
    const stock = stocks.get(filter.symbol);
    return stock ? { ...stock } : null;
  }),
  updateOne: async (filter, update) => {
    calls.updateOne += 1;
    for (const stock of stocks.values()) {
      if (stock._id === filter._id) Object.assign(stock, update.$set);
    }
  },
  bulkWrite: async (operations) => {
    calls.bulkWrite += 1;
    for (const { updateOne } of operations) {
      for (const stock of stocks.values()) {
        if (stock._id === updateOne.filter._id) Object.assign(stock, updateOne.update.$set);
      }
    }
  },
};

const stockModulePath = require.resolve('../models/Stock');
require.cache[stockModulePath] = { id: stockModulePath, filename: stockModulePath, loaded: true, exports: FakeStock };

const provider = require('../services/market/yahooProvider');
const yahoo = require('../services/market/yahooClient');

/* ----- feed stub ----- */

const realFetch = global.fetch;
let feedCalls;
let feedMode;

function chart({ price, previousClose, high, low, candles = 5 }) {
  const timestamps = Array.from({ length: candles }, (_, i) => 1761000000 + i * 86400);
  const closes = timestamps.map((_, i) => (i === candles - 2 ? previousClose : i === candles - 1 ? price : 100 + i));

  return {
    chart: {
      error: null,
      result: [
        {
          meta: {
            regularMarketPrice: price,
            regularMarketDayHigh: high,
            regularMarketDayLow: low,
            fiftyTwoWeekHigh: 200,
            fiftyTwoWeekLow: 50,
            regularMarketTime: 1761345600,
          },
          timestamp: timestamps,
          indicators: {
            quote: [{
              open: closes, high: closes.map((v) => v + 1), low: closes.map((v) => v - 1), close: closes,
              volume: timestamps.map(() => 1000),
            }],
          },
        },
      ],
    },
  };
}

function installFeed() {
  global.fetch = async (url) => {
    const target = String(url);
    feedCalls.push(target);

    if (feedMode === 'down') {
      return { status: 503, ok: false, headers: { getSetCookie: () => [] }, json: async () => ({}), text: async () => '' };
    }

    // Market cap session calls fail quietly; quotes and charts work.
    if (target.includes('fc.yahoo.com') || target.includes('getcrumb') || target.includes('/v7/')) {
      return { status: 404, ok: false, headers: { getSetCookie: () => [] }, json: async () => ({}), text: async () => '' };
    }

    const symbol = decodeURIComponent(target.split('/chart/')[1].split('?')[0]);
    const price = symbol === 'TCS.NS' ? 4000 : 150;
    return {
      status: 200,
      ok: true,
      headers: { getSetCookie: () => [] },
      json: async () => chart({ price, previousClose: price - 10, high: price + 5, low: price - 5 }),
      text: async () => '',
    };
  };
}

function seedStocks() {
  stocks.clear();
  const base = { companyName: 'X', currentPrice: 1, previousClose: 1, dayHigh: 1, dayLow: 1, week52High: 1, week52Low: 1, marketCap: 0 };
  stocks.set('TCS', { _id: 'a', symbol: 'TCS', ...base });
  stocks.set('INFY', { _id: 'b', symbol: 'INFY', ...base });
}

beforeEach(() => {
  provider.resetForTests();
  yahoo.resetCrumbCache();
  seedStocks();
  calls.bulkWrite = 0;
  calls.updateOne = 0;
  feedCalls = [];
  feedMode = 'up';
  installFeed();
});

afterEach(() => {
  global.fetch = realFetch;
});

const chartCalls = () => feedCalls.filter((url) => url.includes('/v8/finance/chart/'));

test('stored quotes are replaced with live prices, previous close and 52-week range', async () => {
  await provider.refresh();

  const tcs = stocks.get('TCS');
  assert.equal(tcs.currentPrice, 4000);
  assert.equal(tcs.previousClose, 3990);
  assert.equal(tcs.dayHigh, 4005);
  assert.equal(tcs.dayLow, 3995);
  assert.equal(tcs.week52High, 4000, '52-week high is widened to include the live price');
  assert.equal(tcs.week52Low, 50);
  assert.ok(tcs.quoteUpdatedAt instanceof Date);
  assert.equal(stocks.get('INFY').currentPrice, 150);
});

test('concurrent readers share one refresh instead of calling the feed per request', async () => {
  await Promise.all([provider.ensureFreshAll(), provider.ensureFreshAll(), provider.ensureFreshAll()]);

  assert.equal(chartCalls().length, 2, 'one feed call per stock, once');
  assert.equal(calls.bulkWrite, 1);
});

test('a fresh quote is not re-fetched within the TTL', async () => {
  await provider.ensureFreshAll();
  const after = chartCalls().length;
  await provider.ensureFreshAll();

  assert.equal(chartCalls().length, after);
});

test('a single stock quote is refreshed on demand and skipped when already fresh', async () => {
  await provider.ensureFresh('TCS');
  assert.equal(stocks.get('TCS').currentPrice, 4000);
  assert.equal(chartCalls().length, 1);

  await provider.ensureFresh('TCS');
  assert.equal(chartCalls().length, 1, 'fresh quote is reused');
  assert.equal(stocks.get('INFY').currentPrice, 1, 'other stocks are untouched');
});

test('when the feed is down the stored quote is kept and the app does not throw', async () => {
  feedMode = 'down';

  await provider.ensureFreshAll();
  await provider.ensureFresh('TCS');

  assert.equal(stocks.get('TCS').currentPrice, 1);
  assert.equal(calls.bulkWrite, 0);
});

test('after a failure the feed is not hammered by every following request', async () => {
  feedMode = 'down';
  await provider.ensureFreshAll();
  const afterFailure = feedCalls.length;

  await provider.ensureFreshAll();
  await provider.ensureFresh('TCS');

  assert.equal(feedCalls.length, afterFailure);
});

test('getQuote returns live detail fields with day change', async () => {
  const quote = await provider.getQuote('tcs');

  assert.equal(quote.currentPrice, 4000);
  assert.equal(quote.changeAmount, 10);
  assert.equal(quote.changePercent, 0.25);
  assert.equal(await provider.getQuote('NOPE'), null);
});

test('getHistory returns candles with OHLC and volume, cached per symbol and range', async () => {
  const history = await provider.getHistory('TCS', '1y');

  assert.equal(history.symbol, 'TCS');
  assert.equal(history.range, '1y');
  assert.equal(history.interval, '1d');
  assert.equal(history.isIntraday, false);
  assert.equal(history.points.length, 5);
  assert.deepEqual(Object.keys(history.points[0]).sort(), ['close', 'high', 'low', 'open', 'price', 'timestamp', 'volume']);
  assert.ok(history.points.every((p, i, all) => i === 0 || p.timestamp > all[i - 1].timestamp));

  const before = chartCalls().length;
  await provider.getHistory('TCS', '1y');
  assert.equal(chartCalls().length, before, 'second read is served from cache');
});

test('one-day history is intraday and is coloured against the previous close', async () => {
  stocks.get('TCS').previousClose = 1e9; // far above the last candle -> down day

  const history = await provider.getHistory('TCS', '1d');

  assert.equal(history.isIntraday, true);
  assert.equal(history.interval, '5m');
  assert.equal(history.startPrice, 1e9);
  assert.equal(history.isUp, false);
});

test('history for an unknown stock is null, and a feed outage becomes a clear 502', async () => {
  assert.equal(await provider.getHistory('NOPE', '1m'), null);

  feedMode = 'down';
  await assert.rejects(() => provider.getHistory('TCS', '3m'), (error) => {
    assert.equal(error.status, 502);
    assert.match(error.message, /temporarily unavailable/);
    return true;
  });
});