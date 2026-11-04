const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  generateSimulatedHistory,
  publicStockFields,
  detailStockFields,
} = require('../services/market/simulatedProvider');
const { normalizeDomain, getLogoUrl } = require('../lib/stockLogo');
const { resolveRange } = require('../services/market/ranges');

/* ----- generator ----- */

test('generates intraday candles inside today with ascending times', () => {
  const definition = { symbol: 'TCS', basePrice: 3800, marketCap: 1000 };
  const now = new Date('2026-10-30T10:00:00.000Z');
  const { intradayPoints } = generateSimulatedHistory(definition, now);

  assert.ok(intradayPoints.length > 0, 'produces at least one intraday point');

  let previous = -Infinity;
  for (const point of intradayPoints) {
    const time = new Date(point.timestamp).getTime();
    assert.ok(time > previous, 'intraday points are strictly ascending');
    assert.ok(point.price > 0, 'prices are positive');
    previous = time;
  }
});

/* ----- ranges ----- */

test('resolveRange defaults to 1m for unknown values', () => {
  assert.equal(resolveRange('1m').key, '1m');
  assert.equal(resolveRange('10y').key, '1m');
  assert.equal(resolveRange(undefined).key, '1m');
  assert.equal(resolveRange('1D').key, '1d');
});

/* ----- logos ----- */

test('logo URLs are built from the company domain or symbol', () => {
  assert.equal(normalizeDomain('https://www.TCS.com/about'), 'tcs.com');
  assert.equal(normalizeDomain('sbi.co.in'), 'sbi.co.in');

  const url = getLogoUrl('tcs.com');
  assert.equal(url, '/logos/tcs.svg');
});

test('logo URLs are omitted for missing or malformed domains', () => {
  assert.equal(getLogoUrl(undefined), null);
  assert.equal(getLogoUrl(''), null);
  assert.equal(getLogoUrl('not a domain'), null);
  assert.equal(getLogoUrl('a.com/../x&y=1'), 'https://www.google.com/s2/favicons?domain=a.com&sz=128');
});

/* ----- payload shape ----- */

const stock = {
  symbol: 'TCS',
  companyName: 'Tata Consultancy Services Ltd',
  sector: 'Information Technology',
  description: 'Details',
  website: 'tcs.com',
  currentPrice: 3900,
  previousClose: 3800,
  dayHigh: 3950,
  dayLow: 3780,
  marketCap: 1,
  week52High: 4200,
  week52Low: 3100,
};

test('guest payload exposes only symbol, name, price and logo', () => {
  const fields = publicStockFields(stock);

  assert.deepEqual(Object.keys(fields).sort(), ['companyName', 'currentPrice', 'logoUrl', 'symbol']);
  assert.equal(fields.logoUrl, '/logos/tcs.svg');
});

test('detail payload computes day change from the stored previous close', () => {
  const detail = detailStockFields(stock);

  assert.equal(detail.changeAmount, 100);
  assert.equal(detail.changePercent, 2.63);
  assert.equal(detail.logoUrl, '/logos/tcs.svg');
});
