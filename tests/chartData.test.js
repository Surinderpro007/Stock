const { test } = require('node:test');
const assert = require('node:assert/strict');

// chartData.ts is plain TypeScript with only erasable types, so Node can load it directly.
const load = () => import('../app/lib/chartData.ts');

test('intraday candles are shifted so the axis reads Indian market time', async () => {
  const { toChartTime, formatBarTime } = await load();

  // NSE opens 09:15 IST = 03:45 UTC
  const time = toChartTime('2026-10-30T03:45:00.000Z', true);

  assert.equal(new Date(time * 1000).toISOString(), '2026-10-30T09:15:00.000Z');
  assert.equal(formatBarTime(time, true), '30 Oct, 9:15 am');
});

test('daily candles are snapped to one slot per Indian trading day', async () => {
  const { toChartTime, buildBars } = await load();

  // 19:00 UTC is already the next calendar day in India.
  assert.equal(
    new Date(toChartTime('2026-10-29T19:00:00.000Z', false) * 1000).toISOString(),
    '2026-10-30T00:00:00.000Z'
  );

  const point = (timestamp, close) => ({ timestamp, price: close, open: close, high: close, low: close, close, volume: 1 });
  const { bars } = buildBars(
    [point('2026-10-30T10:00:00.000Z', 12), point('2026-10-29T03:45:00.000Z', 7), point('2026-10-30T03:45:00.000Z', 10)],
    false
  );

  assert.equal(bars.length, 2, 'two stamps on the same day collapse into one bar');
  assert.deepEqual(bars.map((bar) => bar.close), [7, 10], 'ascending, and the later duplicate wins');
});

test('bars are strictly ascending with no duplicate times', async () => {
  const { buildBars } = await load();
  const stamp = (minute) => `2026-10-30T03:${String(minute).padStart(2, '0')}:00.000Z`;
  const point = (minute) => ({ timestamp: stamp(minute), price: minute, open: 1, high: 2, low: 0.5, close: minute, volume: 3 });

  const { bars } = buildBars([point(50), point(45), point(50), point(55)], true);
  const times = bars.map((bar) => bar.time);

  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  assert.equal(new Set(times).size, times.length);
});

test('close-only data (simulated provider) falls back to a line', async () => {
  const { buildBars } = await load();
  const { bars, hasCandles } = buildBars([{ timestamp: '2026-10-30T03:45:00.000Z', price: 5 }], true);

  assert.equal(hasCandles, false);
  assert.equal(bars[0].open, 5);
  assert.equal(bars[0].close, 5);
});

test('invalid points are skipped and empty history is safe', async () => {
  const { buildBars } = await load();

  assert.equal(buildBars([{ timestamp: 'not-a-date', price: 1 }], true).bars.length, 0);
  assert.equal(buildBars([{ timestamp: '2026-10-30T03:45:00.000Z', price: Number.NaN }], true).bars.length, 0);
  assert.equal(buildBars([], true).hasCandles, false);
});