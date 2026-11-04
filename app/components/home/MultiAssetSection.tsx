'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { PublicStock } from '../../lib/api/stocks';
import { formatPrice } from '../../lib/formatMoney';
import MarketStatusBadge from '../market/MarketStatusBadge';

interface AssetCategory {
  id: string;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  highlights: string[];
  ctaLabel: string;
  ctaHref: string;
}

const ASSET_CATEGORIES: AssetCategory[] = [
  {
    id: 'indian-stocks',
    name: 'Indian Stocks',
    badge: 'NSE & BSE Listed Equities',
    tagline: 'Trade listed equities with zero financial risk',
    description:
      'Practice intraday and swing trading across NIFTY 50 bluechips, high-growth midcaps, and emerging smallcaps with live quote streaming and real-time order matching.',
    highlights: [
      'Real-time price feed and tick-by-tick updates from NSE',
      'Advanced candlestick charts with historical analytics',
      'Instant simulated market order execution',
      'Comprehensive sector categorization across 9 industries',
    ],
    ctaLabel: 'Browse All Listed Stocks',
    ctaHref: '/stocks',
  },
  {
    id: 'us-stocks',
    name: 'US Stocks ($)',
    badge: 'NASDAQ & NYSE Equities',
    tagline: 'Direct exposure to global technology giants',
    description:
      'Practice trading Wall Street market movers including Tesla, Apple, Nvidia, Microsoft, and Alphabet with fractional share capability and dynamic USD/INR conversion.',
    highlights: [
      'Real-time price feeds streamed from US exchanges in USD',
      'Fractional shares support for high-value stocks',
      'Dynamic USD to INR conversion at real-time exchange rates',
      'Zero financial risk paper trading in US Equities',
    ],
    ctaLabel: 'Explore US Equities',
    ctaHref: '/stocks?market=US',
  },
  {
    id: 'banking-basket',
    name: 'Banking & Financials',
    badge: 'Financial Giants Basket',
    tagline: 'Direct exposure to India’s dominant credit institutions',
    description:
      'Track private and public sector banking leaders including HDFC Bank, ICICI Bank, State Bank of India, and Axis Bank with aggregated credit growth momentum.',
    highlights: [
      'Retail and corporate deposit growth tracking',
      'Non-performing asset (NPA) and net interest margin data',
      'High-beta liquidity for active day trading',
      'Quarterly earnings updates and dividend tracking',
    ],
    ctaLabel: 'Explore Banking Equities',
    ctaHref: '/stocks?category=banking',
  },
  {
    id: 'it-tech',
    name: 'IT & Digital Services',
    badge: 'Global Tech Leaders',
    tagline: 'Participate in India’s multi-billion dollar tech export engine',
    description:
      'Practice trading global IT consulting leaders like Tata Consultancy Services, Infosys, and Wipro. Analyze currency tailwinds and international enterprise contract cycles.',
    highlights: [
      'Digital transformation and AI service demand tracking',
      'US Dollar / INR exchange rate sensitivity metrics',
      'High institutional FII/DII holding stability',
      'Consistent historical dividend yield history',
    ],
    ctaLabel: 'Explore IT Equities',
    ctaHref: '/stocks?category=it',
  },
  {
    id: 'infra-auto',
    name: 'Infra & Auto Baskets',
    badge: 'Capital Goods & Mobility',
    tagline: 'Ride India’s industrial manufacturing and infrastructure growth',
    description:
      'Monitor engineering giants like Larsen & Toubro, UltraTech Cement, and automobile pioneers like Maruti Suzuki with capital expenditure tracking.',
    highlights: [
      'Order book execution and national highway infrastructure spend',
      'Monthly automotive passenger and commercial vehicle sales dispatch numbers',
      'Direct correlation to GDP expansion and industrial output',
      'Commodity input cost impact analytics',
    ],
    ctaLabel: 'Explore Infra & Auto',
    ctaHref: '/stocks?category=infrastructure',
  },
  {
    id: 'consumer-fmcg',
    name: 'Consumer & FMCG',
    badge: 'Defensive Compounders',
    tagline: 'All-weather household consumer brands with strong pricing power',
    description:
      'Study bluechip consumer monopolies like Asian Paints, ITC, Hindustan Unilever, and Titan. Experience how defensive cash-cow companies stabilize portfolios during volatility.',
    highlights: [
      'High Return on Capital Employed (ROCE) businesses',
      'Resilient urban and rural consumer demand tracking',
      'Low debt and strong free cash flow generation',
      'Classic dividend compounders for patient portfolios',
    ],
    ctaLabel: 'Explore Consumer Equities',
    ctaHref: '/stocks?category=fmcg',
  },
];

export default function MultiAssetSection({ stocks = [] }: { stocks?: PublicStock[] }) {
  const [activeTab, setActiveTab] = useState<string>('indian-stocks');

  const current = ASSET_CATEGORIES.find((c) => c.id === activeTab) || ASSET_CATEGORIES[0];

  // Dynamically select the relevant live stocks based on the active tab
  const dynamicInstruments = useMemo(() => {
    if (stocks.length === 0) return [];

    if (activeTab === 'us-stocks') {
      return stocks.filter((s) => s.currency === 'USD' || s.market === 'US').slice(0, 5);
    }

    if (activeTab === 'banking-basket') {
      return stocks.filter((s) => {
        const sec = (s.sector || '').toLowerCase();
        return sec.includes('bank') || sec.includes('financial');
      }).slice(0, 5);
    }

    if (activeTab === 'it-tech') {
      return stocks.filter((s) => {
        const sec = (s.sector || '').toLowerCase();
        return sec.includes('information') || sec.includes('tech');
      }).slice(0, 5);
    }

    if (activeTab === 'infra-auto') {
      return stocks.filter((s) => {
        const sec = (s.sector || '').toLowerCase();
        return sec.includes('infra') || sec.includes('auto') || sec.includes('materials');
      }).slice(0, 5);
    }

    if (activeTab === 'consumer-fmcg') {
      return stocks.filter((s) => {
        const sec = (s.sector || '').toLowerCase();
        return sec.includes('fmcg') || sec.includes('consumer');
      }).slice(0, 5);
    }

    // Default: Top Indian Stocks
    return stocks.filter((s) => !s.currency || s.currency === 'INR').slice(0, 5);
  }, [stocks, activeTab]);

  return (
    <section className="mb-20">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase mb-2">
          Multi-Asset Universe
        </p>
        <h2 className="font-serif text-3xl md:text-4xl text-[#14140F] mb-3">
          Trade & Invest from One App
        </h2>
        <p className="text-sm md:text-base text-[#6B6858] leading-relaxed">
          From high-growth tech leaders and banking titans to defensive consumer goods and industrial
          powerhouses — experience complete wealth building with current market data.
        </p>
      </div>

      {/* Asset category tabs */}
      <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar">
        {ASSET_CATEGORIES.map((cat) => {
          const isActive = cat.id === activeTab;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-2 text-xs font-mono rounded-md whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-[#122A22] text-[#F7F5EF] border-[#122A22] shadow-xs font-semibold'
                  : 'bg-white text-[#6B6858] border-[#DDD8CC] hover:bg-[#EFEDE4]'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Active Tab Showcase Card */}
      <div className="bg-white border border-[#DDD8CC] rounded-lg p-6 md:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left info column */}
          <div className="lg:col-span-7">
            <div className="inline-block font-mono text-[11px] text-[#B8935F] bg-[#F7F5EF] border border-[#DDD8CC] px-2.5 py-0.5 rounded uppercase tracking-wider mb-3">
              {current.badge}
            </div>
            <h3 className="font-serif text-2xl text-[#14140F] mb-2">{current.tagline}</h3>
            <p className="text-sm text-[#6B6858] leading-relaxed mb-6">{current.description}</p>

            {/* Feature highlights bullet grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {current.highlights.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-[#2F6B4F] font-mono text-sm leading-none mt-0.5">✓</span>
                  <span className="text-xs text-[#14140F] font-sans">{point}</span>
                </div>
              ))}
            </div>

            <Link
              href={current.ctaHref}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md hover:bg-[#0D1F19] transition-colors shadow-xs"
            >
              <span>{current.ctaLabel}</span>
              <span className="text-[#B8935F]">→</span>
            </Link>
          </div>

          {/* Right dynamic sample assets column with REAL live quotes */}
          <div className="lg:col-span-5 bg-[#F7F5EF] border border-[#DDD8CC] rounded-md p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#DDD8CC] mb-3 gap-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[#6B6858]">
                Monitored Equities
              </span>
              <MarketStatusBadge
                market={activeTab === 'us-stocks' ? 'US' : 'IN'}
                priceTime={dynamicInstruments[0]?.priceTime}
                quoteUpdatedAt={dynamicInstruments[0]?.quoteUpdatedAt}
              />
            </div>

            <div className="space-y-2.5">
              {dynamicInstruments.map((asset) => {
                const isUp = (asset.changeAmount || 0) >= 0;
                return (
                  <Link
                    key={asset.symbol}
                    href={`/stocks/${asset.symbol}`}
                    className="flex items-center justify-between p-2.5 bg-white border border-[#DDD8CC] rounded hover:border-[#B8935F] hover:bg-[#FBF9F4] transition-all group block"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-[#122A22] group-hover:text-[#B8935F] transition-colors block">
                          {asset.symbol}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B6858]">
                          • {asset.sector}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#6B6858] truncate block">
                        {asset.companyName}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono text-xs font-semibold text-[#14140F] block">
                        {formatPrice(asset.currentPrice, asset.currency || 'INR')}
                      </span>
                      <span
                        className={`font-mono text-[11px] font-semibold block ${
                          isUp ? 'text-[#2F6B4F]' : 'text-[#9B3A32]'
                        }`}
                      >
                        {isUp ? '+' : ''}
                        {(asset.changePercent || 0).toFixed(2)}%
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <p className="mt-4 text-[10px] font-mono text-center text-[#6B6858]">
              Latest available quotes from the market data feed.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
