const { test } = require('node:test');
const assert = require('node:assert/strict');
const { publicStockFields, detailStockFields } = require('../services/market/simulatedProvider');
const { tradeBodySchema } = require('../lib/tradeValidation');
const { historyQuerySchema } = require('../lib/stockValidation');
const { httpError } = require('../lib/apiError');

const sample = {
  symbol: 'TCS',
  companyName: 'Tata Consultancy Services Ltd',
  sector: 'Information Technology',
  description: 'Full company write-up',
  currentPrice: 3900,
  previousClose: 3800,
  dayHigh: 3950,
  dayLow: 3780,
  marketCap: 14000000000000,
  week52High: 4200,
  week52Low: 3100,
};

test('public payload never includes charts, description, or range data', () => {
  const publicFields = publicStockFields(sample);
  assert.deepEqual(Object.keys(publicFields).sort(), ['companyName', 'currentPrice', 'symbol']);
  assert.equal('description' in publicFields, false);
  assert.equal('dayHigh' in publicFields, false);
  assert.equal('week52High' in publicFields, false);
});

test('logged-in detail payload includes company and range stats', () => {
  const detail = detailStockFields(sample);
  assert.equal(detail.description, sample.description);
  assert.equal(detail.dayHigh, sample.dayHigh);
  assert.equal(detail.changeAmount, 100);
});

test('guest-style login error uses 401', () => {
  const error = httpError('Please log in to get full access', 401);
  assert.equal(error.status, 401);
});

test('trade body rejects invalid quantity', () => {
  const parsed = tradeBodySchema.safeParse({ symbol: 'TCS', quantity: 0 });
  assert.equal(parsed.success, false);
});

test('trade body accepts a valid buy', () => {
  const parsed = tradeBodySchema.safeParse({ symbol: 'TCS', quantity: 3 });
  assert.equal(parsed.success, true);
});

test('history range rejects unknown values', () => {
  const parsed = historyQuerySchema.safeParse({ range: '10y' });
  assert.equal(parsed.success, false);
});
