'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function TradersInvestorsSection() {
  const [activePersona, setActivePersona] = useState<'traders' | 'investors'>('traders');

  return (
    <section className="mb-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase mb-2">
          Tailored Workflows
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-[#14140F] mb-3">
          Built for Active Traders & Patient Investors
        </h2>
        <p className="text-sm md:text-base text-[#6B6858] leading-relaxed">
          Whether you capture intraday swings or compound long-term wealth, StockApp delivers the
          exact tools tailored to your investment methodology.
        </p>
      </div>

      {/* Persona toggle tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 bg-white border border-[#DDD8CC] rounded-lg shadow-xs">
          <button
            type="button"
            onClick={() => setActivePersona('traders')}
            className={`px-5 py-2 text-xs font-mono rounded-md transition-all ${
              activePersona === 'traders'
                ? 'bg-[#122A22] text-[#F7F5EF] shadow-xs'
                : 'text-[#6B6858] hover:text-[#122A22]'
            }`}
          >
            ⚡ For Active Traders
          </button>
          <button
            type="button"
            onClick={() => setActivePersona('investors')}
            className={`px-5 py-2 text-xs font-mono rounded-md transition-all ${
              activePersona === 'investors'
                ? 'bg-[#122A22] text-[#F7F5EF] shadow-xs'
                : 'text-[#6B6858] hover:text-[#122A22]'
            }`}
          >
            🌱 For Long-Term Investors
          </button>
        </div>
      </div>

      {/* Feature Grids */}
      {activePersona === 'traders' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
            <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-sm mb-3">
              ⚡
            </div>
            <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Instant Order Pad</h4>
            <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
              Fast quantity steppers, quick presets (1, 5, 10, 25, 50), and zero-latency simulated
              market order fills with automated balance checks.
            </p>
            <span className="text-[11px] font-mono text-[#2F6B4F] font-semibold">
              Instant Fill Simulation
            </span>
          </div>

          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
            <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-sm mb-3">
              ★
            </div>
            <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Live Watchlist Pinning</h4>
            <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
              Pin high-beta equities with a single click. Monitor price fluctuations, percentage
              changes, and sector movements in real-time.
            </p>
            <span className="text-[11px] font-mono text-[#2F6B4F] font-semibold">
              Cloud-Synced Watchlist
            </span>
          </div>

          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
            <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-sm mb-3">
              📈
            </div>
            <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Interactive Charts</h4>
            <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
              Analyze candlestick formations, volume distribution, intraday highs and lows, and
              52-week price boundaries before executing a trade.
            </p>
            <span className="text-[11px] font-mono text-[#2F6B4F] font-semibold">
              Technical Chart Depth
            </span>
          </div>

          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
            <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-sm mb-3">
              📰
            </div>
            <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Live Market Wire</h4>
            <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
              Filter financial news dynamically by company symbol or sector. Stay ahead of earnings
              reports, regulatory moves, and global cues.
            </p>
            <span className="text-[11px] font-mono text-[#2F6B4F] font-semibold">
              Real-Time Feed
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
            <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-sm mb-3">
              💼
            </div>
            <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Holdings Ledger</h4>
            <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
              Track weighted average buy price, net quantity, real-time portfolio market value, and
              unrealized P&L down to the rupee.
            </p>
            <span className="text-[11px] font-mono text-[#B8935F] font-semibold">
              Weighted Cost Averaging
            </span>
          </div>

          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
            <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-sm mb-3">
              💳
            </div>
            <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Dedicated Cash Wallet</h4>
            <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
              Manage your liquidity separately from your stock holdings. Practice cash allocation,
              fund deposits, and portfolio risk management.
            </p>
            <span className="text-[11px] font-mono text-[#B8935F] font-semibold">
              Isolated Capital Ledger
            </span>
          </div>

          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
            <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-sm mb-3">
              🌐
            </div>
            <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Sector Diversification</h4>
            <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
              Filter by Banking, IT, Infrastructure, Pharma, Energy, FMCG, and Auto to build an
              all-weather, multi-sector portfolio.
            </p>
            <span className="text-[11px] font-mono text-[#B8935F] font-semibold">
              9 Core Market Sectors
            </span>
          </div>

          <div className="bg-white border border-[#DDD8CC] rounded-lg p-5 shadow-xs hover:border-[#B8935F] transition-all">
            <div className="w-9 h-9 rounded bg-[#F7F5EF] border border-[#DDD8CC] text-[#122A22] flex items-center justify-center font-mono font-bold text-sm mb-3">
              🛡️
            </div>
            <h4 className="font-serif text-lg text-[#14140F] mb-1.5">Zero Capital Risk</h4>
            <p className="text-xs text-[#6B6858] leading-relaxed mb-3">
              Test investment theses and holding periods through market corrections and rallies
              without risking hard-earned capital.
            </p>
            <span className="text-[11px] font-mono text-[#B8935F] font-semibold">
              100% Risk-Free Learning
            </span>
          </div>
        </div>
      )}

      <div className="text-center mt-8">
        <Link
          href="/stocks"
          className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md hover:bg-[#0D1F19] transition-colors shadow-xs"
        >
          <span>Explore All Features in Practice Mode</span>
          <span className="text-[#B8935F]">→</span>
        </Link>
      </div>
    </section>
  );
}
