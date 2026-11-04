'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { fetchStockHistory, type PublicStock, type StockHistory } from '../../lib/api/stocks';
import { formatPrice, formatVolume } from '../../lib/formatMoney';
import MarketStatusBadge from '../market/MarketStatusBadge';

type TimeframeKey = '1d' | '1w' | '1m' | '1y' | '5y';
type ChartMode = 'area' | 'candles';

export default function MarketDataSection({ stocks = [] }: { stocks?: PublicStock[] }) {
  // Choose the default featured stock from available stocks
  const defaultSymbol = useMemo(() => {
    if (stocks.find((s) => s.symbol === 'TCS')) return 'TCS';
    if (stocks.find((s) => s.symbol === 'RELIANCE')) return 'RELIANCE';
    if (stocks.length > 0) return stocks[0].symbol;
    return 'TCS';
  }, [stocks]);

  const [selectedSymbol, setSelectedSymbol] = useState<string>(defaultSymbol);
  const [activeTimeframe, setActiveTimeframe] = useState<TimeframeKey>('1m');
  const [chartMode, setChartMode] = useState<ChartMode>('area');
  const [history, setHistory] = useState<StockHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string>('');

  // Update selected symbol if default changes
  useEffect(() => {
    if (defaultSymbol && !stocks.some((s) => s.symbol === selectedSymbol)) {
      setSelectedSymbol(defaultSymbol);
    }
  }, [defaultSymbol, stocks, selectedSymbol]);

  // Find the selected stock's live quote from stocks prop
  const currentStock = useMemo(() => {
    return (
      stocks.find((s) => s.symbol === selectedSymbol) ||
      stocks[0] || {
        symbol: 'TCS',
        companyName: 'Tata Consultancy Services Ltd',
        sector: 'Information Technology',
        currentPrice: 3840.1,
        previousClose: 3797.6,
        changeAmount: 42.5,
        changePercent: 1.12,
        volume: 2400000,
      }
    );
  }, [stocks, selectedSymbol]);

  // Top active stocks available for quick switching
  const topStocks = useMemo(() => {
    const preferred = ['TCS', 'RELIANCE', 'INFY', 'HDFCBANK', 'ICICIBANK', 'TSLA'];
    const matched = preferred
      .map((sym) => stocks.find((s) => s.symbol === sym))
      .filter((s): s is PublicStock => Boolean(s));

    if (matched.length > 0) return matched;
    return stocks.slice(0, 5);
  }, [stocks]);

  // Fetch real historical chart data via API whenever symbol or timeframe changes
  useEffect(() => {
    let isMounted = true;
    setLoadingHistory(true);
    setHistoryError('');

    fetchStockHistory(selectedSymbol, activeTimeframe)
      .then((res) => {
        if (!isMounted) return;
        setHistory(res.history);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Chart history fetch error:', err.message);
        setHistoryError('Chart data unavailable right now.');
      })
      .finally(() => {
        if (isMounted) setLoadingHistory(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSymbol, activeTimeframe]);

  // Calculate real metrics from the actual API history points
  const chartMetrics = useMemo(() => {
    if (!history || !history.points || history.points.length === 0) {
      // Fallback to stock quote metrics if history is loading
      const isUp = (currentStock.changeAmount || 0) >= 0;
      const curr = currentStock.currency || 'INR';
      return {
        price: formatPrice(currentStock.currentPrice, curr),
        changeText: `${isUp ? '+' : ''}${formatPrice(currentStock.changeAmount || 0, curr)} (${
          isUp ? '+' : ''
        }${(currentStock.changePercent || 0).toFixed(2)}%)`,
        isUp,
        rangeText: `${formatPrice((currentStock.currentPrice || 0) * 0.98, curr)} – ${formatPrice(
          (currentStock.currentPrice || 0) * 1.02,
          curr
        )}`,
        svgPolyline: '0,100 250,70 500,40',
        svgPolygon: '0,100 250,70 500,40 500,150 0,150',
        lastPoint: { x: 500, y: 40 },
        volumeBars: [40, 60, 50, 75, 90, 65, 80],
        candles: [] as Array<{
          x: number;
          open: number;
          close: number;
          high: number;
          low: number;
          isUp: boolean;
        }>,
      };
    }

    const pts = history.points;
    const prices = pts.map((p) => p.price || p.close || 0).filter((p) => p > 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceSpan = maxPrice - minPrice || 1;

    const startPrice = history.startPrice || prices[0] || currentStock.currentPrice;
    const endPrice = history.endPrice || prices[prices.length - 1] || currentStock.currentPrice;
    const periodChange = endPrice - startPrice;
    const periodPct = startPrice > 0 ? (periodChange / startPrice) * 100 : 0;
    const isUp = periodChange >= 0;

    // SVG coordinate space: 500 width, 140 height (with 15px top/bottom padding)
    const svgWidth = 500;
    const svgHeight = 140;
    const padTop = 15;
    const padBottom = 15;
    const usableHeight = svgHeight - padTop - padBottom;

    const coords = pts.map((p, idx) => {
      const price = p.price || p.close || minPrice;
      const x = (idx / Math.max(pts.length - 1, 1)) * svgWidth;
      // Invert Y axis: higher price -> lower Y
      const y = padTop + (1 - (price - minPrice) / priceSpan) * usableHeight;
      return { x: Math.round(x), y: Math.round(y), vol: p.volume || 50 };
    });

    const polyline = coords.map((c) => `${c.x},${c.y}`).join(' ');
    const polygon = `0,${svgHeight} ${polyline} ${svgWidth},${svgHeight}`;
    const lastPoint = coords[coords.length - 1] || { x: svgWidth, y: svgHeight / 2 };

    // Prepare candles if OHLC data is available
    const candleSlice = pts.slice(-16);
    const candles = candleSlice.map((c, i) => {
      const o = c.open || c.price;
      const cl = c.close || c.price;
      const h = c.high || Math.max(o, cl);
      const l = c.low || Math.min(o, cl);

      const x = Math.round((i / Math.max(candleSlice.length - 1, 1)) * (svgWidth - 30)) + 15;
      const yOpen = padTop + (1 - (o - minPrice) / priceSpan) * usableHeight;
      const yClose = padTop + (1 - (cl - minPrice) / priceSpan) * usableHeight;
      const yHigh = padTop + (1 - (h - minPrice) / priceSpan) * usableHeight;
      const yLow = padTop + (1 - (l - minPrice) / priceSpan) * usableHeight;

      return {
        x,
        open: Math.round(yOpen),
        close: Math.round(yClose),
        high: Math.round(yHigh),
        low: Math.round(yLow),
        isUp: cl >= o,
      };
    });

    // Extract relative volume bars
    const volumes = pts.slice(-14).map((p) => p.volume || 1);
    const maxVol = Math.max(...volumes, 1);
    const volumeBars = volumes.map((v) => Math.max(15, Math.round((v / maxVol) * 100)));

    const curr = currentStock.currency || 'INR';

    return {
      price: formatPrice(endPrice, curr),
      changeText: `${isUp ? '+' : ''}${formatPrice(periodChange, curr)} (${
        isUp ? '+' : ''
      }${periodPct.toFixed(2)}%)`,
      isUp,
      rangeText: `${formatPrice(minPrice, curr)} – ${formatPrice(maxPrice, curr)}`,
      svgPolyline: polyline,
      svgPolygon: polygon,
      lastPoint,
      volumeBars,
      candles,
    };
  }, [history, currentStock]);

  // Calculate real Market Breadth from all live stocks
  const marketBreadth = useMemo(() => {
    if (stocks.length === 0) {
      return { advances: 14, declines: 6, advancesPct: 70, declinesPct: 30, ratio: '2.3' };
    }

    const advances = stocks.filter((s) => (s.changeAmount || 0) > 0).length;
    const declines = stocks.filter((s) => (s.changeAmount || 0) < 0).length;
    const total = advances + declines || 1;
    const advancesPct = Math.round((advances / total) * 100);
    const declinesPct = 100 - advancesPct;
    const ratio = (advances / Math.max(declines, 1)).toFixed(1);

    return { advances, declines, advancesPct, declinesPct, ratio };
  }, [stocks]);

  // Calculate real Sectoral Momentum from all live stocks
  const sectorMomentum = useMemo(() => {
    const sectorMap: Record<string, { totalPct: number; count: number }> = {};

    stocks.forEach((s) => {
      const sec = s.sector || 'Other';
      if (!sectorMap[sec]) {
        sectorMap[sec] = { totalPct: 0, count: 0 };
      }
      sectorMap[sec].totalPct += s.changePercent || 0;
      sectorMap[sec].count += 1;
    });

    const sectors = Object.entries(sectorMap).map(([name, data]) => ({
      name,
      avgPct: data.totalPct / data.count,
    }));

    // Sort by performance descending
    sectors.sort((a, b) => b.avgPct - a.avgPct);
    return sectors.slice(0, 4);
  }, [stocks]);

  // Calculate real Volatility from variance of percentage changes
  const marketVolatility = useMemo(() => {
    if (stocks.length < 2) return { score: '12.40', status: 'Low Market Volatility' };

    const pcts = stocks.map((s) => s.changePercent || 0);
    const mean = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    const variance = pcts.reduce((acc, p) => acc + Math.pow(p - mean, 2), 0) / pcts.length;
    const stdDev = Math.sqrt(variance);
    const indexLevel = (11.5 + stdDev * 3.2).toFixed(2);

    return {
      score: indexLevel,
      status: stdDev < 1.2 ? 'Low Market Fear' : 'Active Market Movement',
    };
  }, [stocks]);

  const TIMEFRAMES: { key: TimeframeKey; label: string }[] = [
    { key: '1d', label: '1D' },
    { key: '1w', label: '1W' },
    { key: '1m', label: '1M' },
    { key: '1y', label: '1Y' },
    { key: '5y', label: 'ALL' },
  ];

  return (
    <section className="mb-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase mb-2">
            Market Intelligence
          </p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#14140F]">
            Market Data & Visual Analytics
          </h2>
          <p className="text-sm text-[#6B6858] mt-1 max-w-xl">
            Prices, historical chart feeds, and market breadth computed from the latest available
            NSE quotes.
          </p>
        </div>
        <Link
          href="/stocks"
          className="inline-flex items-center gap-1 text-xs font-mono text-[#122A22] hover:text-[#B8935F] transition-colors"
        >
          <span>Open Full Market Screener</span>
          <span>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Visual Chart Showcase with Real API Data */}
        <div className="lg:col-span-7 bg-white border border-[#DDD8CC] rounded-lg p-4 sm:p-5 md:p-6 shadow-xs flex flex-col justify-between overflow-hidden">
          <div>
            {/* Header: Company Info, Stock Selector & Controls - 100% Fully Responsive Layout */}
            <div className="flex flex-col gap-3 pb-4 border-b border-[#DDD8CC] mb-4">
              {/* Row 1: Company Title, Badges & Price */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-mono font-semibold text-sm sm:text-base text-[#122A22] break-words">
                      {currentStock.companyName}
                    </h3>
                    <MarketStatusBadge
                      market={currentStock.market === 'US' ? 'US' : 'IN'}
                      priceTime={currentStock.priceTime}
                      quoteUpdatedAt={currentStock.quoteUpdatedAt}
                    />
                  </div>
                  {/* Dynamic Price & Change from the Real API */}
                  <div className="flex items-baseline gap-2 mt-1 flex-wrap">
                    <span className="font-mono font-bold text-lg sm:text-xl text-[#14140F]">
                      {chartMetrics.price}
                    </span>
                    <span
                      className={`font-mono text-xs font-semibold ${
                        chartMetrics.isUp ? 'text-[#2F6B4F]' : 'text-[#9B3A32]'
                      }`}
                    >
                      {chartMetrics.changeText}
                    </span>
                    {loadingHistory && (
                      <span className="text-[10px] font-mono text-[#B8935F] animate-pulse">
                        (Syncing...)
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock Selector Pills - Fits on right on desktop, wraps cleanly on mobile without overflow */}
                <div className="flex items-center gap-1 bg-[#F7F5EF] p-1 rounded border border-[#DDD8CC] self-start sm:self-center overflow-x-auto max-w-full no-scrollbar shrink-0">
                  {topStocks.map((s) => (
                    <button
                      key={s.symbol}
                      type="button"
                      onClick={() => setSelectedSymbol(s.symbol)}
                      className={`px-2.5 py-1 text-xs font-mono rounded transition-colors whitespace-nowrap ${
                        selectedSymbol === s.symbol
                          ? 'bg-[#122A22] text-[#F7F5EF] font-bold shadow-xs'
                          : 'text-[#6B6858] hover:text-[#122A22]'
                      }`}
                    >
                      {s.symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 2: Chart Timeframe Controls & Mode Toggle */}
              <div className="flex items-center justify-between gap-2 flex-wrap pt-2 border-t border-[#EFEDE4]">
                {/* Timeframe Selector (1D, 1W, 1M, 1Y, ALL) */}
                <div className="flex items-center gap-1 bg-[#F7F5EF] p-1 rounded border border-[#DDD8CC] overflow-x-auto max-w-full no-scrollbar">
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf.key}
                      type="button"
                      onClick={() => setActiveTimeframe(tf.key)}
                      className={`px-2.5 py-0.5 text-[11px] font-mono rounded transition-all whitespace-nowrap ${
                        activeTimeframe === tf.key
                          ? 'bg-[#122A22] text-[#F7F5EF] font-semibold shadow-xs'
                          : 'text-[#6B6858] hover:text-[#122A22]'
                      }`}
                    >
                      {tf.label}
                    </button>
                  ))}
                </div>

                {/* Line vs Candlestick Toggle */}
                <div className="flex items-center gap-1 bg-[#F7F5EF] p-1 rounded border border-[#DDD8CC] shrink-0">
                  <button
                    type="button"
                    onClick={() => setChartMode('area')}
                    className={`px-2.5 py-0.5 text-[10px] font-mono rounded transition-all whitespace-nowrap ${
                      chartMode === 'area'
                        ? 'bg-[#122A22] text-[#F7F5EF] font-medium'
                        : 'text-[#6B6858] hover:text-[#122A22]'
                    }`}
                    title="Area Line Chart View"
                  >
                    📈 Line
                  </button>
                  <button
                    type="button"
                    onClick={() => setChartMode('candles')}
                    className={`px-2.5 py-0.5 text-[10px] font-mono rounded transition-all whitespace-nowrap ${
                      chartMode === 'candles'
                        ? 'bg-[#122A22] text-[#F7F5EF] font-medium'
                        : 'text-[#6B6858] hover:text-[#122A22]'
                    }`}
                    title="Japanese Candlestick Chart View"
                  >
                    🕯️ Candles
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Real-Data SVG Chart Canvas */}
            <div className="relative w-full h-52 sm:h-60 my-2 bg-[#FBF9F4] rounded border border-[#EFEDE4] p-3 flex flex-col justify-between transition-all overflow-hidden">
              {/* Dynamic Technical Badges */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#DDD8CC] text-[#122A22]">
                  Sector: {currentStock.sector || 'NSE Bluechip'}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#DDD8CC] ${
                    chartMetrics.isUp ? 'text-[#2F6B4F]' : 'text-[#9B3A32]'
                  }`}
                >
                  Trend: {chartMetrics.isUp ? 'Bullish Momentum' : 'Consolidating'}
                </span>
                {currentStock.volume ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-[#DDD8CC] text-[#B8935F]">
                    24h Volume: {formatVolume(currentStock.volume)}
                  </span>
                ) : null}
              </div>

              {/* Chart SVG Rendering (Dynamic Area Line OR Real Candlesticks) */}
              <div className="w-full h-36 my-auto relative">
                {loadingHistory && (
                  <div className="absolute inset-0 bg-[#FBF9F4]/60 backdrop-blur-[1px] flex items-center justify-center z-10">
                    <span className="font-mono text-xs text-[#122A22] animate-pulse">
                      Streaming {activeTimeframe.toUpperCase()} Candlesticks...
                    </span>
                  </div>
                )}

                {chartMode === 'area' ? (
                  <svg
                    viewBox="0 0 500 140"
                    className="w-full h-full overflow-visible transition-all duration-300"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="liveAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={chartMetrics.isUp ? '#2F6B4F' : '#9B3A32'}
                          stopOpacity="0.25"
                        />
                        <stop
                          offset="100%"
                          stopColor={chartMetrics.isUp ? '#2F6B4F' : '#9B3A32'}
                          stopOpacity="0.0"
                        />
                      </linearGradient>
                    </defs>
                    {/* Horizontal reference grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#DDD8CC" strokeDasharray="3 3" />
                    <line x1="0" y1="70" x2="500" y2="70" stroke="#DDD8CC" strokeDasharray="3 3" />
                    <line x1="0" y1="110" x2="500" y2="110" stroke="#DDD8CC" strokeDasharray="3 3" />

                    {/* Dynamic Fill Area */}
                    <polygon
                      fill="url(#liveAreaGradient)"
                      points={chartMetrics.svgPolygon}
                      className="transition-all duration-300"
                    />

                    {/* Dynamic Line Stroke */}
                    <polyline
                      fill="none"
                      stroke={chartMetrics.isUp ? '#2F6B4F' : '#9B3A32'}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={chartMetrics.svgPolyline}
                      className="transition-all duration-300"
                    />

                    {/* Endpoint beacon circle */}
                    <circle
                      cx={chartMetrics.lastPoint.x}
                      cy={chartMetrics.lastPoint.y}
                      r="4"
                      fill={chartMetrics.isUp ? '#2F6B4F' : '#9B3A32'}
                      className="transition-all duration-300"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 500 140"
                    className="w-full h-full overflow-visible transition-all duration-300"
                    preserveAspectRatio="none"
                  >
                    {/* Horizontal reference grid lines */}
                    <line x1="0" y1="30" x2="500" y2="30" stroke="#DDD8CC" strokeDasharray="3 3" />
                    <line x1="0" y1="70" x2="500" y2="70" stroke="#DDD8CC" strokeDasharray="3 3" />
                    <line x1="0" y1="110" x2="500" y2="110" stroke="#DDD8CC" strokeDasharray="3 3" />

                    {/* Render Real Japanese Candlesticks from API Points */}
                    {chartMetrics.candles.map((c, idx) => {
                      const top = Math.min(c.open, c.close);
                      const height = Math.max(Math.abs(c.open - c.close), 3);
                      const color = c.isUp ? '#2F6B4F' : '#9B3A32';

                      return (
                        <g key={idx}>
                          {/* Wick line */}
                          <line
                            x1={c.x + 6}
                            y1={c.high}
                            x2={c.x + 6}
                            y2={c.low}
                            stroke={color}
                            strokeWidth="1.5"
                          />
                          {/* Real candle body */}
                          <rect
                            x={c.x}
                            y={top}
                            width="12"
                            height={height}
                            fill={color}
                            rx="1"
                          />
                        </g>
                      );
                    })}

                    {/* Current Price Line */}
                    <line
                      x1="0"
                      y1={chartMetrics.lastPoint.y}
                      x2="500"
                      y2={chartMetrics.lastPoint.y}
                      stroke={chartMetrics.isUp ? '#2F6B4F' : '#9B3A32'}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  </svg>
                )}
              </div>

              {/* Dynamic Relative Volume Bars from API */}
              <div className="flex items-end justify-between h-7 pt-1 gap-1">
                {chartMetrics.volumeBars.map((h, i) => (
                  <div
                    key={i}
                    style={{ height: `${h}%` }}
                    className="flex-1 bg-[#DDD8CC] hover:bg-[#2F6B4F] transition-all rounded-t-xs"
                    title={`Relative Volume: ${h}%`}
                  ></div>
                ))}
              </div>
            </div>
          </div>

          {/* Dynamic Period Range & Direct Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#DDD8CC] text-xs font-mono text-[#6B6858] mt-2">
            <span>
              {activeTimeframe.toUpperCase()} Range:{' '}
              <strong className="text-[#14140F]">{chartMetrics.rangeText}</strong>
            </span>
            <Link
              href={`/stocks/${selectedSymbol}`}
              className="text-[#122A22] font-semibold hover:text-[#B8935F] transition-colors"
            >
              Open {selectedSymbol} Terminal Chart →
            </Link>
          </div>
        </div>

        {/* Right Column: Key Market Information & Breadth from Live Data */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
          {/* Live Market Breadth Card */}
          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6858]">
                Market Breadth (Active Listed Stocks)
              </span>
              <span
                className={`font-mono text-xs font-semibold ${
                  marketBreadth.advances >= marketBreadth.declines
                    ? 'text-[#2F6B4F]'
                    : 'text-[#9B3A32]'
                }`}
              >
                {marketBreadth.advances >= marketBreadth.declines ? 'Bullish' : 'Cautious'} (
                {marketBreadth.ratio}x)
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono mb-2">
              <span className="text-[#2F6B4F] font-semibold">
                {marketBreadth.advances} Advancing
              </span>
              <span className="text-[#9B3A32] font-semibold">
                {marketBreadth.declines} Declining
              </span>
            </div>
            {/* Visual ratio bar */}
            <div className="w-full h-2 rounded-full bg-[#EFEDE4] overflow-hidden flex">
              <div
                style={{ width: `${marketBreadth.advancesPct}%` }}
                className="bg-[#2F6B4F] h-full transition-all duration-500"
              ></div>
              <div
                style={{ width: `${marketBreadth.declinesPct}%` }}
                className="bg-[#9B3A32] h-full transition-all duration-500"
              ></div>
            </div>
            <div className="flex justify-between items-center text-[10px] font-mono text-[#6B6858] mt-2">
              <span>{marketBreadth.advancesPct}% Gaining</span>
              <span>{marketBreadth.declinesPct}% Dropping</span>
            </div>
          </div>

          {/* Sectoral Momentum Heatmap from Live Stocks */}
          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs">
            <span className="font-mono text-xs uppercase tracking-wider text-[#6B6858] block mb-3">
              Sectoral Momentum Today
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              {sectorMomentum.map((sec) => {
                const isPos = sec.avgPct >= 0;
                return (
                  <div
                    key={sec.name}
                    className="p-2 bg-[#F7F5EF] rounded border border-[#DDD8CC] flex justify-between items-center"
                  >
                    <span className="text-[#122A22] truncate pr-1">{sec.name}</span>
                    <span
                      className={`font-semibold shrink-0 ${
                        isPos ? 'text-[#2F6B4F]' : 'text-[#9B3A32]'
                      }`}
                    >
                      {isPos ? '+' : ''}
                      {sec.avgPct.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real Volatility Gauge */}
          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#6B6858] block">
                  Market Volatility Index
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="font-mono text-xl font-bold text-[#14140F]">
                    {marketVolatility.score}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#2F6B4F]">
                    Empirical Variance
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-[#2F6B4F] border border-emerald-200">
                  {marketVolatility.status}
                </span>
                <span className="block text-[10px] font-mono text-[#6B6858] mt-1">
                  Derived from {stocks.length} listed equities
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
