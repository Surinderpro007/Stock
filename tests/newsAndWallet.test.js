const { test } = require('node:test');
const assert = require('node:assert/strict');
const { STARTING_BALANCE } = require('../config/trading');
const { roundMoney } = require('../lib/money');
const {
  getTimeAgo,
  detectSymbols,
  categorizeArticle,
  cleanHtml,
  getFallbackNews,
} = require('../services/newsService');

test('trading config provides standard starting balance', () => {
  assert.equal(typeof STARTING_BALANCE, 'number');
  assert.ok(STARTING_BALANCE > 0);
  assert.equal(STARTING_BALANCE, 10000);
});

test('wallet money rounding preserves 2 decimal places', () => {
  assert.equal(roundMoney(10000.555), 10000.56);
  assert.equal(roundMoney(0.1 + 0.2), 0.3);
});

test('newsService detectSymbols correctly identifies Indian tickers', () => {
  const text1 = 'Reliance Industries Jio telecom expansion';
  assert.deepEqual(detectSymbols(text1), ['RELIANCE']);

  const text2 = 'HDFC Bank and ICICI Bank lead the Nifty financial index';
  const symbols = detectSymbols(text2);
  assert.ok(symbols.includes('HDFCBANK'));
  assert.ok(symbols.includes('ICICIBANK'));
});

test('newsService categorizeArticle labels categories based on content', () => {
  assert.equal(categorizeArticle('TCS Q2 Results Profit up 12%'), 'Earnings');
  assert.equal(categorizeArticle('RBI announces repo rate pause'), 'Economy');
  assert.equal(categorizeArticle('Nifty 50 trades in green'), 'Markets');
});

test('newsService cleanHtml removes tags and CDATA', () => {
  assert.equal(cleanHtml('<![CDATA[Livemint News]]>'), 'Livemint News');
  assert.equal(cleanHtml('<b>Stock</b> &amp; Share'), 'Stock & Share');
});

test('newsService getFallbackNews provides valid structured items', () => {
  const items = getFallbackNews();
  assert.ok(Array.isArray(items));
  assert.ok(items.length >= 5);
  for (const item of items) {
    assert.ok(item.title);
    assert.ok(item.source);
    assert.ok(item.link);
    assert.ok(item.pubDate);
    assert.ok(Array.isArray(item.symbols));
  }
});

test('newsService getTimeAgo calculates human-readable relative time', () => {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  assert.equal(getTimeAgo(fiveMinAgo), '5m ago');

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  assert.equal(getTimeAgo(twoHoursAgo), '2h ago');
});
