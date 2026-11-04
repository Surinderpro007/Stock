import type { HistoryPoint } from '../app/lib/api/stocks';

export type Bar = {
  /** Seconds since epoch, shifted to IST so the chart axis shows Indian market time. */
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

const IST_OFFSET_SECONDS = 5.5 * 60 * 60;
const DAY_SECONDS = 24 * 60 * 60;

/**
 * The chart library draws timestamps as UTC. Shifting by +5:30 makes a 09:15 IST
 * open appear as 09:15 on the axis for every viewer. Daily/weekly candles are
 * snapped to midnight so each trading day has exactly one slot.
 */
export function toChartTime(timestamp: string, intraday: boolean): number | null {
  const ms = Date.parse(timestamp);

  if (!Number.isFinite(ms)) {
    return null;
  }

  const shifted = Math.floor(ms / 1000) + IST_OFFSET_SECONDS;
  return intraday ? shifted : Math.floor(shifted / DAY_SECONDS) * DAY_SECONDS;
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * Converts API history points into strictly ascending, duplicate-free bars.
 * The chart library throws on duplicate or unsorted times, so this is enforced here.
 * `hasCandles` is false when the API only supplied a close price (simulated data).
 */
export function buildBars(
  points: HistoryPoint[],
  intraday: boolean
): { bars: Bar[]; hasCandles: boolean } {
  const byTime = new Map<number, Bar>();
  let hasCandles = points.length > 0;

  for (const point of points) {
    const time = toChartTime(point.timestamp, intraday);
    const close = finite(point.close) ? point.close : point.price;

    if (time === null || !finite(close)) {
      continue;
    }

    const complete =
      finite(point.open) && finite(point.high) && finite(point.low) && finite(point.close);

    if (!complete) {
      hasCandles = false;
    }

    byTime.set(time, {
      time,
      open: complete ? (point.open as number) : close,
      high: complete ? (point.high as number) : close,
      low: complete ? (point.low as number) : close,
      close,
      volume: finite(point.volume) ? point.volume : 0,
    });
  }

  const bars = [...byTime.values()].sort((a, b) => a.time - b.time);

  return { bars, hasCandles: hasCandles && bars.length > 0 };
}

/** "30 Oct 2026" for daily candles, "30 Oct, 3:25 pm" for intraday ones. */
export function formatBarTime(time: number, intraday: boolean) {
  const date = new Date(time * 1000);

  // `time` is already IST-shifted, so read it back as UTC.
  return intraday
    ? date.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC',
      })
    : date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
}