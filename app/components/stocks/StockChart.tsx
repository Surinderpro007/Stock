'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type MouseEventParams,
  type Time,
  type UTCTimestamp,
} from 'lightweight-charts';
import { formatPercent } from '../../lib/formatMoney';
// import { buildBars, formatBarTime, type Bar } from '.';
import { buildBars, formatBarTime, type Bar } from '../../../lib/chartData';
import type { StockHistory } from '../../lib/api/stocks';

const RANGES = [
  { key: '1d', label: '1D' },
  { key: '1w', label: '1W' },
  { key: '1m', label: '1M' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: '1y', label: '1Y' },
  { key: '5y', label: '5Y' },
];

type ChartType = 'candles' | 'line';

const COLORS = {
  up: '#2F6B4F',
  down: '#9B3A32',
  upVolume: 'rgba(47, 107, 79, 0.30)',
  downVolume: 'rgba(155, 58, 50, 0.30)',
  text: '#6B6858',
  grid: '#EFEDE4',
  border: '#DDD8CC',
  crosshair: '#8A8672',
};

function formatPrice(value: number) {
  return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatVolume(value: number) {
  if (value >= 1e7) return `${(value / 1e7).toFixed(2)} Cr`;
  if (value >= 1e5) return `${(value / 1e5).toFixed(2)} L`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)} K`;
  return String(value);
}

function Legend({ bar, intraday, showOhlc }: { bar: Bar | null; intraday: boolean; showOhlc: boolean }) {
  if (!bar) {
    return <div className="h-5" />;
  }

  const change = bar.close - bar.open;
  const percent = bar.open ? (change / bar.open) * 100 : 0;
  const tone = change >= 0 ? 'text-[#2F6B4F]' : 'text-[#9B3A32]';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-[#6B6858] min-h-5">
      <span className="text-[#122A22]">{formatBarTime(bar.time, intraday)}</span>
      {showOhlc ? (
        <>
          <span>
            O <span className={tone}>{formatPrice(bar.open)}</span>
          </span>
          <span>
            H <span className={tone}>{formatPrice(bar.high)}</span>
          </span>
          <span>
            L <span className={tone}>{formatPrice(bar.low)}</span>
          </span>
          <span>
            C <span className={tone}>{formatPrice(bar.close)}</span>
          </span>
          <span className={tone}>{formatPercent(percent)}</span>
          {bar.volume > 0 && <span>Vol {formatVolume(bar.volume)}</span>}
        </>
      ) : (
        <span>
          Price <span className="text-[#122A22]">{formatPrice(bar.close)}</span>
        </span>
      )}
    </div>
  );
}

export default function StockChart({
  history,
  range,
  onRangeChange,
  loading,
}: {
  history: StockHistory | null;
  range: string;
  onRangeChange: (range: string) => void;
  loading: boolean;
}) {
  const [chartType, setChartType] = useState<ChartType>('candles');
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const intraday = history ? (history.isIntraday ?? history.interval === 'intraday') : false;
  const { bars, hasCandles } = useMemo(
    () => buildBars(history?.points ?? [], intraday),
    [history, intraday]
  );
  const isUp = history?.isUp ?? true;

  // Without OHLC values (offline simulated data) only a line can be drawn.
  const effectiveType: ChartType = hasCandles ? chartType : 'line';

  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Area'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const fittedKeyRef = useRef('');

  // Latest data, readable from the chart effects without re-creating the chart.
  // `dataRange` is the range the loaded data belongs to. It differs from the selected
  // `range` while a new range is still loading, and zoom must only reset once it arrives.
  const dataRange = history?.range ?? '';
  const latestRef = useRef({ bars, intraday, isUp, dataRange, effectiveType });
  useEffect(() => {
    latestRef.current = { bars, intraday, isUp, dataRange, effectiveType };
  });

  const barsByTime = useMemo(() => new Map(bars.map((bar) => [bar.time, bar])), [bars]);
  const barsByTimeRef = useRef(barsByTime);
  useEffect(() => {
    barsByTimeRef.current = barsByTime;
  }, [barsByTime]);

  // Pushes the latest data into the series. Zoom is only reset when the range or chart type changes.
  function applyData() {
    const chart = chartRef.current;
    const main = mainSeriesRef.current;
    const volume = volumeSeriesRef.current;

    if (!chart || !main || !volume) {
      return;
    }

    const { bars: data, intraday: isIntraday, isUp: up, dataRange: loadedRange, effectiveType: type } =
      latestRef.current;

    if (type === 'candles') {
      (main as ISeriesApi<'Candlestick'>).setData(
        data.map((bar) => ({
          time: bar.time as UTCTimestamp,
          open: bar.open,
          high: bar.high,
          low: bar.low,
          close: bar.close,
        }))
      );
    } else {
      const lineColor = up ? COLORS.up : COLORS.down;
      (main as ISeriesApi<'Area'>).applyOptions({
        lineColor,
        topColor: up ? 'rgba(47, 107, 79, 0.25)' : 'rgba(155, 58, 50, 0.25)',
        bottomColor: 'rgba(255, 255, 255, 0)',
      });
      (main as ISeriesApi<'Area'>).setData(
        data.map((bar) => ({ time: bar.time as UTCTimestamp, value: bar.close }))
      );
    }

    volume.setData(
      data.map((bar) => ({
        time: bar.time as UTCTimestamp,
        value: bar.volume,
        color: bar.close >= bar.open ? COLORS.upVolume : COLORS.downVolume,
      }))
    );

    chart.applyOptions({ timeScale: { timeVisible: isIntraday } });

    const fitKey = `${loadedRange}|${type}`;
    if (fittedKeyRef.current !== fitKey && data.length > 0) {
      chart.timeScale().fitContent();
      fittedKeyRef.current = fitKey;
    }
  }

  // Create the chart (and re-create it only when switching between candles and line).
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#FFFFFF' },
        textColor: COLORS.text,
        fontSize: 11,
      },
      grid: {
        vertLines: { color: COLORS.grid },
        horzLines: { color: COLORS.grid },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: COLORS.crosshair, labelBackgroundColor: '#122A22' },
        horzLine: { color: COLORS.crosshair, labelBackgroundColor: '#122A22' },
      },
      rightPriceScale: { borderColor: COLORS.border },
      timeScale: { borderColor: COLORS.border, secondsVisible: false, rightOffset: 4 },
      localization: { priceFormatter: (price: number) => formatPrice(price) },
    });

    const main =
      latestRef.current.effectiveType === 'candles'
        ? chart.addSeries(CandlestickSeries, {
            upColor: COLORS.up,
            downColor: COLORS.down,
            wickUpColor: COLORS.up,
            wickDownColor: COLORS.down,
            borderVisible: false,
          })
        : chart.addSeries(AreaSeries, { lineWidth: 2, crosshairMarkerRadius: 4 });

    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      lastValueVisible: false,
      priceLineVisible: false,
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    const onCrosshairMove = (param: MouseEventParams<Time>) => {
      setHoverTime(param.point && typeof param.time === 'number' ? param.time : null);
    };
    chart.subscribeCrosshairMove(onCrosshairMove);

    chartRef.current = chart;
    mainSeriesRef.current = main;
    volumeSeriesRef.current = volume;
    fittedKeyRef.current = '';
    applyData();

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshairMove);
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // applyData only reads refs, so it is intentionally not a dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveType]);

  // Update data in place when the history, range or colour changes.
  useEffect(() => {
    applyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bars, intraday, isUp]);

  const lastBar = bars.length ? bars[bars.length - 1] : null;
  const legendBar = (hoverTime !== null ? barsByTime.get(hoverTime) : null) ?? lastBar;
  const showOverlay = loading || bars.length === 0;

  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase">Price chart</p>
        <div className="flex flex-wrap items-center gap-3">
          {hasCandles && (
            <div className="flex gap-1" role="group" aria-label="Chart type">
              {(['candles', 'line'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setChartType(type)}
                  aria-pressed={chartType === type}
                  className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                    chartType === type
                      ? 'bg-[#122A22] text-[#F7F5EF] border-[#122A22]'
                      : 'border-[#DDD8CC] text-[#122A22] hover:bg-[#F7F5EF]'
                  }`}
                >
                  {type === 'candles' ? 'Candles' : 'Line'}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-1" role="group" aria-label="Time range">
            {RANGES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onRangeChange(item.key)}
                aria-pressed={range === item.key}
                className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                  range === item.key
                    ? 'bg-[#122A22] text-[#F7F5EF] border-[#122A22]'
                    : 'border-[#DDD8CC] text-[#122A22] hover:bg-[#F7F5EF]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-2">
        <Legend bar={legendBar} intraday={intraday} showOhlc={effectiveType === 'candles'} />
      </div>

      <div className="relative h-80">
        <div ref={containerRef} className="absolute inset-0" />
        {showOverlay && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 text-sm text-[#6B6858]">
            {loading ? 'Loading chart...' : 'No history for this range.'}
          </div>
        )}
      </div>
    </div>
  );
}