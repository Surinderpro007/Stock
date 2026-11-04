const MINUTE = 60 * 1000;
const DAY = 24 * 60 * MINUTE;

/**
 * Chart ranges.
 *  - interval / durationMs : used by the simulated provider (reads PriceHistory).
 *  - yahoo                 : range + candle size requested from the live feed.
 *  - cacheTtlMs            : how long a live history response is reused in memory.
 */
const RANGES = {
  '1d': {
    interval: 'intraday',
    durationMs: DAY,
    yahoo: { range: '1d', interval: '5m' },
    cacheTtlMs: MINUTE,
  },
  '1w': {
    interval: 'daily',
    durationMs: 7 * DAY,
    yahoo: { range: '5d', interval: '15m' },
    cacheTtlMs: 5 * MINUTE,
  },
  '1m': {
    interval: 'daily',
    durationMs: 30 * DAY,
    yahoo: { range: '1mo', interval: '1d' },
    cacheTtlMs: 15 * MINUTE,
  },
  '3m': {
    interval: 'daily',
    durationMs: 90 * DAY,
    yahoo: { range: '3mo', interval: '1d' },
    cacheTtlMs: 15 * MINUTE,
  },
  '6m': {
    interval: 'daily',
    durationMs: 180 * DAY,
    yahoo: { range: '6mo', interval: '1d' },
    cacheTtlMs: 15 * MINUTE,
  },
  '1y': {
    interval: 'daily',
    durationMs: 365 * DAY,
    yahoo: { range: '1y', interval: '1d' },
    cacheTtlMs: 15 * MINUTE,
  },
  '5y': {
    interval: 'daily',
    durationMs: 5 * 365 * DAY,
    yahoo: { range: '5y', interval: '1wk' },
    cacheTtlMs: 60 * MINUTE,
  },
};

const RANGE_KEYS = Object.keys(RANGES);

function resolveRange(range) {
  const requested = String(range || '1m').toLowerCase();
  const key = RANGES[requested] ? requested : '1m';

  return { key, ...RANGES[key] };
}

module.exports = {
  RANGES,
  RANGE_KEYS,
  resolveRange,
};