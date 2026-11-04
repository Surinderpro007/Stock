'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PublicStock } from '../../lib/api/stocks';
import { formatRupee } from '../../lib/formatMoney';
import { useMarketStatus } from '../../hooks/useMarketStatus';

type ViewMode = 'dual' | 'desktop' | 'mobile';

export default function ExperienceSection({ stocks = [] }: { stocks?: PublicStock[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>('dual');

  // Select real live featured stock and ticker samples from the database
  const featuredStock = useMemo(() => {
    return (
      stocks.find((s) => s.symbol === 'TCS') ||
      stocks.find((s) => s.symbol === 'RELIANCE') ||
      stocks[0] || {
        symbol: 'NIFTY 50',
        currentPrice: 24345.8,
        changeAmount: 142.3,
        changePercent: 0.59,
      }
    );
  }, [stocks]);

  const tickerStocks = useMemo(() => {
    if (stocks.length >= 3) {
      return stocks.slice(0, 3);
    }
    return [
      { symbol: 'RELIANCE', currentPrice: 2980.5, changePercent: 1.45 },
      { symbol: 'HDFCBANK', currentPrice: 1640.2, changePercent: 0.82 },
      { symbol: 'INFY', currentPrice: 1185.0, changePercent: 3.36 },
    ];
  }, [stocks]);

  const isUp = (featuredStock.changeAmount || 0) >= 0;
  const nseOpen = useMarketStatus('IN').isOpen;

  return (
    <section className="mb-20">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase mb-2">
          Cross-Platform Architecture
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-[#14140F] mb-3">
          Trade Seamlessly on Desktop & Mobile
        </h2>
        <p className="text-sm md:text-base text-[#6B6858] leading-relaxed">
          Switch effortlessly between in-depth multi-monitor desktop analysis and lightning-fast mobile
          trading with uninterrupted real-time cloud sync.
        </p>
      </div>

      {/* Interactive Tabs Selector */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 bg-white border border-[#DDD8CC] rounded-lg shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode('dual')}
            className={`px-4 sm:px-5 py-2 text-xs font-mono rounded-md transition-all ${
              viewMode === 'dual'
                ? 'bg-[#122A22] text-[#F7F5EF] shadow-xs font-semibold'
                : 'text-[#6B6858] hover:text-[#122A22]'
            }`}
          >
            🖥️📱 Dual-Screen Ecosystem
          </button>
          <button
            type="button"
            onClick={() => setViewMode('desktop')}
            className={`px-4 sm:px-5 py-2 text-xs font-mono rounded-md transition-all ${
              viewMode === 'desktop'
                ? 'bg-[#122A22] text-[#F7F5EF] shadow-xs font-semibold'
                : 'text-[#6B6858] hover:text-[#122A22]'
            }`}
          >
            💻 Desktop Pro Terminal
          </button>
          <button
            type="button"
            onClick={() => setViewMode('mobile')}
            className={`px-4 sm:px-5 py-2 text-xs font-mono rounded-md transition-all ${
              viewMode === 'mobile'
                ? 'bg-[#122A22] text-[#F7F5EF] shadow-xs font-semibold'
                : 'text-[#6B6858] hover:text-[#122A22]'
            }`}
          >
            📱 Mobile Web App
          </button>
        </div>
      </div>

      {/* Hero Dual Device Graphical Composition with REAL LIVE Quotes */}
      <div className="relative bg-[#FFFFFF] border border-[#DDD8CC] rounded-2xl p-4 sm:p-6 md:p-10 shadow-sm overflow-hidden mb-10">
        <div className="relative max-w-4xl mx-auto">
          {/* 1. Large Desktop/Tablet Monitor (Background) */}
          <div
            className={`transition-all duration-300 ${
              viewMode === 'mobile' ? 'opacity-30 blur-[1px]' : 'opacity-100'
            }`}
          >
            <div className="bg-[#1C2024] rounded-xl border-4 sm:border-8 border-[#2E353B] shadow-2xl overflow-hidden font-mono text-xs text-white">
              {/* Terminal Top Navigation Bar */}
              <div className="bg-[#161A1D] px-3 sm:px-4 py-2 border-b border-[#2E353B] flex items-center justify-between text-[11px] text-[#A0AEC0]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  </div>
                  <div className="h-3 w-px bg-[#2E353B] hidden sm:block"></div>
                  <span className="font-bold text-white tracking-wide">
                    {featuredStock.symbol}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-emerald-400">
                    1W
                  </span>
                  <span className="text-[10px] text-white/50 hidden md:inline">NSE</span>
                  <span
                    className={`text-[10px] font-semibold hidden sm:inline ${
                      isUp ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatRupee(featuredStock.currentPrice)} ({isUp ? '+' : ''}
                    {(featuredStock.changePercent || 0).toFixed(2)}%)
                  </span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 text-[10px]">
                  <span className="hidden sm:inline hover:text-white cursor-pointer">
                    fx Indicators
                  </span>
                  <span className="hidden md:inline hover:text-white cursor-pointer">
                    Templates
                  </span>
                  <div className="h-3 w-px bg-[#2E353B] hidden sm:block"></div>
                  <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
                    {nseOpen ? '● Live Feed' : '● Market Closed'}
                  </span>
                </div>
              </div>

              {/* Main Terminal Chart Body */}
              <div className="relative flex h-64 sm:h-80 md:h-96 bg-[#121619]">
                {/* Left Drawing Tools Rail */}
                <div className="w-8 sm:w-10 bg-[#161A1D] border-r border-[#2E353B] flex flex-col items-center py-2 gap-3 text-[#A0AEC0] text-xs shrink-0 select-none">
                  <span className="p-1 rounded hover:bg-white/10 cursor-pointer" title="Crosshair">
                    ✛
                  </span>
                  <span className="p-1 rounded hover:bg-white/10 cursor-pointer" title="Trend Line">
                    ╱
                  </span>
                  <span
                    className="p-1 rounded hover:bg-white/10 cursor-pointer"
                    title="Pitchfork / Channels"
                  >
                    ⫙
                  </span>
                  <span
                    className="p-1 rounded hover:bg-white/10 cursor-pointer"
                    title="Fibonacci Retracement"
                  >
                    ≡
                  </span>
                  <span className="p-1 rounded hover:bg-white/10 cursor-pointer" title="Brush">
                    ✎
                  </span>
                  <span className="p-1 rounded hover:bg-white/10 cursor-pointer" title="Text Note">
                    T
                  </span>
                  <span
                    className="p-1 rounded hover:bg-white/10 cursor-pointer hidden sm:block"
                    title="Measure Ruler"
                  >
                    📏
                  </span>
                  <span
                    className="p-1 rounded hover:bg-white/10 cursor-pointer hidden sm:block"
                    title="Magnet Mode"
                  >
                    🧲
                  </span>
                </div>

                {/* Center Candlestick Chart SVG Canvas */}
                <div className="flex-1 relative overflow-hidden p-2 sm:p-4">
                  {/* Grid Lines */}
                  <div className="absolute inset-0 grid grid-rows-5 grid-cols-6 pointer-events-none opacity-10">
                    {Array.from({ length: 30 }).map((_, i) => (
                      <div key={i} className="border-b border-r border-white"></div>
                    ))}
                  </div>

                  {/* Candlesticks SVG */}
                  <svg
                    viewBox="0 0 600 240"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    {/* EMA 20 Gold Trendline */}
                    <path
                      d="M 10 180 Q 150 160, 300 110 T 580 45"
                      fill="none"
                      stroke="#B8935F"
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />

                    {/* EMA 50 Emerald Trendline */}
                    <path
                      d="M 10 200 Q 180 180, 340 140 T 580 80"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="1.5"
                      opacity="0.6"
                    />

                    {/* Candlestick Bars */}
                    {[
                      { x: 20, o: 190, c: 175, h: 165, l: 200, up: true },
                      { x: 50, o: 175, c: 182, h: 170, l: 190, up: false },
                      { x: 80, o: 182, c: 160, h: 155, l: 188, up: true },
                      { x: 110, o: 160, c: 145, h: 140, l: 168, up: true },
                      { x: 140, o: 145, c: 152, h: 140, l: 160, up: false },
                      { x: 170, o: 152, c: 130, h: 122, l: 158, up: true },
                      { x: 200, o: 130, c: 138, h: 125, l: 145, up: false },
                      { x: 230, o: 138, c: 115, h: 108, l: 144, up: true },
                      { x: 260, o: 115, c: 98, h: 90, l: 122, up: true },
                      { x: 290, o: 98, c: 106, h: 94, l: 114, up: false },
                      { x: 320, o: 106, c: 85, h: 78, l: 112, up: true },
                      { x: 350, o: 85, c: 92, h: 80, l: 98, up: false },
                      { x: 380, o: 92, c: 68, h: 60, l: 98, up: true },
                      { x: 410, o: 68, c: 54, h: 48, l: 74, up: true },
                      { x: 440, o: 54, c: 62, h: 50, l: 70, up: false },
                      { x: 470, o: 62, c: 42, h: 36, l: 68, up: true },
                      { x: 500, o: 42, c: 32, h: 26, l: 48, up: true },
                      { x: 530, o: 32, c: 38, h: 28, l: 44, up: false },
                      { x: 560, o: 38, c: 22, h: 18, l: 42, up: true },
                    ].map((c, i) => {
                      const top = Math.min(c.o, c.c);
                      const height = Math.max(Math.abs(c.o - c.c), 4);
                      const color = c.up ? '#10B981' : '#EF4444';
                      return (
                        <g key={i}>
                          <line
                            x1={c.x + 6}
                            y1={c.h}
                            x2={c.x + 6}
                            y2={c.l}
                            stroke={color}
                            strokeWidth="1.5"
                          />
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

                    {/* Active price dotted line across chart */}
                    <line
                      x1="0"
                      y1="22"
                      x2="600"
                      y2="22"
                      stroke="#10B981"
                      strokeWidth="1"
                      strokeDasharray="4 3"
                    />
                  </svg>
                </div>

                {/* Right Price Scale Axis */}
                <div className="w-16 sm:w-20 bg-[#161A1D] border-l border-[#2E353B] flex flex-col justify-between py-3 text-[9px] sm:text-[10px] text-[#A0AEC0] text-right pr-1.5 sm:pr-2 shrink-0 select-none">
                  <span>₹{(featuredStock.currentPrice * 1.05).toFixed(0)}</span>
                  <span>₹{(featuredStock.currentPrice * 1.02).toFixed(0)}</span>
                  <span className="text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded font-bold">
                    {formatRupee(featuredStock.currentPrice)}
                  </span>
                  <span>₹{(featuredStock.currentPrice * 0.98).toFixed(0)}</span>
                  <span>₹{(featuredStock.currentPrice * 0.95).toFixed(0)}</span>
                </div>
              </div>

              {/* Real Ticker Bar in Terminal Footer */}
              <div className="bg-[#161A1D] px-3 sm:px-4 py-2 border-t border-[#2E353B] flex flex-wrap items-center justify-between text-[10px] text-[#A0AEC0] gap-2">
                <div className="flex items-center gap-3">
                  {tickerStocks.map((s) => {
                    const up = (s.changePercent || 0) >= 0;
                    return (
                      <span key={s.symbol} className="flex items-center gap-1 font-mono">
                        <span className="text-white font-semibold">{s.symbol}:</span>
                        <span>{formatRupee(s.currentPrice)}</span>
                        <span className={up ? 'text-emerald-400' : 'text-rose-400'}>
                          ({up ? '+' : ''}
                          {(s.changePercent || 0).toFixed(1)}%)
                        </span>
                      </span>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2">
                  <span className={nseOpen ? 'text-emerald-400' : 'text-[#A0AEC0]'}>
                    {nseOpen ? '● Live Feed' : '● Last session'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Overlapping Mobile Smartphone (Foreground) with Live Quotes */}
          <div
            className={`absolute bottom-[-15px] sm:bottom-[-20px] right-2 sm:right-8 md:right-16 w-48 sm:w-56 md:w-64 transition-all duration-300 z-10 ${
              viewMode === 'desktop' ? 'opacity-30 blur-[1px]' : 'opacity-100'
            }`}
          >
            {/* Phone Bezel */}
            <div className="bg-[#161A1D] border-4 sm:border-6 border-[#2E353B] rounded-3xl shadow-2xl overflow-hidden font-mono text-white text-[10px]">
              {/* Top Speaker / Dynamic Island Notch */}
              <div className="pt-2 pb-1 bg-[#121619] flex justify-center items-center">
                <div className="w-12 h-1.5 bg-[#2E353B] rounded-full"></div>
              </div>

              {/* Mobile Phone Screen Header with Real Live Quote */}
              <div className="bg-[#161A1D] px-2.5 py-1.5 border-b border-[#2E353B] flex items-center justify-between">
                <div>
                  <div className="font-bold text-white text-[10px]">
                    {featuredStock.symbol} · 1W
                  </div>
                  <div className={`text-[8px] ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {formatRupee(featuredStock.currentPrice)} ({isUp ? '+' : ''}
                    {(featuredStock.changePercent || 0).toFixed(2)}%)
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[8px] border border-emerald-800">
                    {nseOpen ? 'NSE Live' : 'NSE Closed'}
                  </span>
                </div>
              </div>

              {/* Mobile Candlestick Chart Area */}
              <div className="h-36 sm:h-44 bg-[#121619] p-2 relative overflow-hidden flex">
                <svg
                  viewBox="0 0 180 120"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <line x1="0" y1="30" x2="180" y2="30" stroke="#2E353B" strokeDasharray="2 2" />
                  <line x1="0" y1="60" x2="180" y2="60" stroke="#2E353B" strokeDasharray="2 2" />
                  <line x1="0" y1="90" x2="180" y2="90" stroke="#2E353B" strokeDasharray="2 2" />

                  <path
                    d="M 5 95 Q 60 80, 110 50 T 175 22"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="1.2"
                  />

                  {[
                    { x: 10, o: 95, c: 88, h: 82, l: 100, up: true },
                    { x: 30, o: 88, c: 92, h: 84, l: 96, up: false },
                    { x: 50, o: 92, c: 74, h: 68, l: 95, up: true },
                    { x: 70, o: 74, c: 62, h: 56, l: 78, up: true },
                    { x: 90, o: 62, c: 68, h: 58, l: 72, up: false },
                    { x: 110, o: 68, c: 48, h: 42, l: 70, up: true },
                    { x: 130, o: 48, c: 34, h: 28, l: 52, up: true },
                    { x: 150, o: 34, c: 40, h: 30, l: 44, up: false },
                    { x: 170, o: 40, c: 22, h: 16, l: 44, up: true },
                  ].map((c, i) => {
                    const top = Math.min(c.o, c.c);
                    const height = Math.max(Math.abs(c.o - c.c), 3);
                    const color = c.up ? '#10B981' : '#EF4444';
                    return (
                      <g key={i}>
                        <line
                          x1={c.x + 3.5}
                          y1={c.h}
                          x2={c.x + 3.5}
                          y2={c.l}
                          stroke={color}
                          strokeWidth="1.2"
                        />
                        <rect
                          x={c.x}
                          y={top}
                          width="7"
                          height={height}
                          fill={color}
                          rx="0.5"
                        />
                      </g>
                    );
                  })}

                  <line
                    x1="0"
                    y1="22"
                    x2="180"
                    y2="22"
                    stroke="#10B981"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                </svg>
              </div>

              {/* Mobile Quick Trade Bar */}
              <div className="p-2 bg-[#161A1D] border-t border-[#2E353B] flex gap-1.5">
                <Link
                  href={`/stocks/${featuredStock.symbol}`}
                  className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[9px] font-bold text-center block"
                >
                  BUY {featuredStock.symbol}
                </Link>
                <Link
                  href={`/stocks/${featuredStock.symbol}`}
                  className="flex-1 py-1 bg-rose-700 hover:bg-rose-600 text-white rounded text-[9px] font-bold text-center block"
                >
                  SELL {featuredStock.symbol}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid Below */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
          <div className="w-8 h-8 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-xs mb-3">
            🖥️
          </div>
          <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Desktop Pro Terminal</h4>
          <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
            Multi-chart layouts, 100+ technical indicators, drawing toolbars, and instant order pad
            with quantity stepper buttons.
          </p>
          <span className="text-[11px] font-mono text-[#2F6B4F] font-semibold">
            Institutional Layout
          </span>
        </div>

        <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
          <div className="w-8 h-8 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-xs mb-3">
            📱
          </div>
          <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Mobile Web Experience</h4>
          <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
            Touch-first candlestick charts, 1-tap virtual execution, mobile wallet top-up, and zero
            horizontal scrollbar clutter.
          </p>
          <span className="text-[11px] font-mono text-[#2F6B4F] font-semibold">
            Zero-Lag Responsive
          </span>
        </div>

        <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
          <div className="w-8 h-8 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-xs mb-3">
            ☁️
          </div>
          <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Instant Cloud Sync</h4>
          <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
            Stocks you pin on mobile appear immediately in your desktop watchlist. Your portfolio and
            wallet balance stay in real-time lockstep.
          </p>
          <span className="text-[11px] font-mono text-[#B8935F] font-semibold">
            Universal Real-Time State
          </span>
        </div>
      </div>

      <div className="text-center mt-8">
        <Link
          href={`/stocks/${featuredStock.symbol}`}
          className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md hover:bg-[#0D1F19] transition-colors shadow-xs"
        >
          <span>Trade {featuredStock.symbol} on Live Chart Terminal</span>
          <span className="text-[#B8935F]">→</span>
        </Link>
      </div>
    </section>
  );
}