const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  getMarketStatus,
  isMarketOpen,
  isQuoteLive,
  needsQuoteRefresh,
  liveLabel,
} = require('../lib/marketStatus');

function ist(isoLocal) {
  // Interpret the wall time as IST (UTC+5:30).
  return new Date(isoLocal + '+05:30');
}

test('NSE is closed on Saturday', () => {
  const status = getMarketStatus('IN', ist('2026-10-31T12:00:00'));
  assert.equal(status.isOpen, false);
  assert.equal(status.state, 'weekend');
  assert.match(status.label, /Weekend/);
});

test('NSE is open on a weekday during regular hours', () => {
  const status = getMarketStatus('IN', ist('2026-10-30T10:00:00'));
  assert.equal(status.isOpen, true);
  assert.equal(status.state, 'open');
  assert.equal(status.exchange, 'NSE');
});

test('NSE is closed after 15:30 IST', () => {
  const status = getMarketStatus('IN', ist('2026-10-30T16:00:00'));
  assert.equal(status.isOpen, false);
  assert.equal(status.state, 'closed');
  assert.match(status.label, /Market Closed/);
});

test('NSE is closed before 9:15 IST', () => {
  const status = getMarketStatus('IN', ist('2026-10-30T09:00:00'));
  assert.equal(status.isOpen, false);
});

test('NSE is closed on Republic Day 2026', () => {
  const status = getMarketStatus('IN', ist('2026-01-26T11:00:00'));
  assert.equal(status.isOpen, false);
  assert.equal(status.state, 'holiday');
  assert.match(status.label, /Republic Day/);
});

test('NASDAQ is closed on Saturday in New York', () => {
  const status = getMarketStatus('US', new Date('2026-10-31T16:00:00.000Z'));
  assert.equal(status.isOpen, false);
  assert.equal(status.state, 'weekend');
});

test('NASDAQ is open on a weekday during regular hours', () => {
  // Friday 30 Oct 2026 14:00 UTC = 10:00 EDT (DST still in effect).
  const status = getMarketStatus('US', new Date('2026-10-30T14:00:00.000Z'));
  assert.equal(status.isOpen, true);
  assert.equal(status.exchange, 'NASDAQ');
});

test('NASDAQ is closed on Independence Day observed 2026', () => {
  const status = getMarketStatus('US', new Date('2026-07-03T15:00:00.000Z'));
  assert.equal(status.state, 'holiday');
  assert.equal(status.isOpen, false);
});

test('Live flag requires an open session and a fresh quote', () => {
  const openAt = ist('2026-10-30T11:00:00');
  const closedAt = ist('2026-10-30T16:00:00');
  const fresh = new Date(openAt.getTime() - 60 * 1000);

  assert.equal(isQuoteLive({ priceTime: fresh, now: openAt }), true);
  assert.equal(
    getMarketStatus('IN', openAt).isOpen && isQuoteLive({ priceTime: fresh, now: openAt }),
    true
  );
  assert.equal(
    getMarketStatus('IN', closedAt).isOpen && isQuoteLive({ priceTime: closedAt, now: closedAt }),
    false
  );
});

test('stale quotes after the close are refreshed once', () => {
  const afterClose = ist('2026-10-30T16:05:00');
  const duringSession = ist('2026-10-30T14:00:00');
  assert.equal(needsQuoteRefresh(duringSession, 'IN', afterClose), true);
  assert.equal(needsQuoteRefresh(afterClose, 'IN', ist('2026-10-30T18:00:00')), false);
});

test('liveLabel never says Live when the market is closed', () => {
  const status = getMarketStatus('IN', ist('2026-10-31T12:00:00'));
  assert.equal(liveLabel(status, false).includes('Live'), false);
  assert.match(liveLabel(status, false), /Closed|Weekend/);
});

test('isMarketOpen matches getMarketStatus', () => {
  const open = ist('2026-10-30T12:00:00');
  const closed = ist('2026-10-31T12:00:00');
  assert.equal(isMarketOpen('IN', open), getMarketStatus('IN', open).isOpen);
  assert.equal(isMarketOpen('IN', closed), false);
});
