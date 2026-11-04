'use client';

import { useState } from 'react';
import LoginRequired from '../components/auth/LoginRequired';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import StockTable from '../components/stocks/StockTable';
import ContextualMarketNews from '../components/news/ContextualMarketNews';
import { useStocks } from '../hooks/useStocks';
import { useWatchlist } from '../hooks/useWatchlist';
import MarketStatusBadge from '../components/market/MarketStatusBadge';

const TRADING_CATEGORIES = [
  { id: 'all', label: 'All Stocks' },
  { id: 'banking', label: 'Banking' },
  { id: 'it', label: 'IT' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'pharma', label: 'Pharma' },
  { id: 'energy', label: 'Energy' },
  { id: 'fmcg', label: 'FMCG' },
  { id: 'auto', label: 'Auto' },
  { id: 'consumer', label: 'Consumer Durables' },
];

export default function StocksClient() {
  const {
    q,
    setQ,
    category,
    setCategory,
    market,
    setMarket,
    sortBy,
    order,
    toggleSort,
    stocks,
    guest,
    loading,
    refreshing,
    lastUpdated,
    error,
    reload,
  } = useStocks();

  // Load watchlist state for logged in users
  const { symbols: watchlistSymbols, toggle: toggleWatchlist } = useWatchlist();
  const [showGate, setShowGate] = useState(false);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Top live status header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase">Market</p>
        <div className="flex items-center gap-3">
          <MarketStatusBadge
            market={market}
            priceTime={stocks[0]?.priceTime}
            quoteUpdatedAt={stocks[0]?.quoteUpdatedAt}
            lastUpdated={lastUpdated}
          />
          {lastUpdated && (
            <span className="text-[11px] font-mono text-[#6B6858] hidden sm:inline">
              • Refreshed {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            onClick={reload}
            disabled={loading || refreshing}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono text-[#122A22] bg-white hover:bg-[#EFEDE4] border border-[#DDD8CC] rounded transition-colors disabled:opacity-50"
            title="Fetch latest stock quotes via API"
          >
            <span className={loading || refreshing ? 'animate-spin inline-block' : ''}>↻</span>
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Main Title and Search */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-[#14140F]">Listed stocks</h1>
          <p className="text-sm text-[#6B6858] mt-1">
            {market === 'US'
              ? 'Browse leading Wall Street equities across technology, finance, and consumer sectors in USD'
              : 'Browse real-time Indian equities across major sectors and market capitalization in INR'}
          </p>
        </div>
        <input
          type="search"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={`Search ${market === 'US' ? 'US ticker (e.g. AAPL, NVDA)...' : 'symbol or name...'}`}
          className="w-full md:w-72 border border-[#DDD8CC] rounded-md px-3 py-2 text-sm bg-white text-[#14140F] focus:outline-none focus:ring-1 focus:ring-[#122A22]"
        />
      </div>

      {/* Market Menu/Tab Switcher: Indian Stocks vs US Stocks */}
      <div className="flex items-center gap-2 mb-6 border-b border-[#DDD8CC]">
        <button
          type="button"
          onClick={() => setMarket('IN')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-medium border-b-2 transition-all ${
            market === 'IN'
              ? 'border-[#122A22] text-[#122A22] font-semibold bg-white/50'
              : 'border-transparent text-[#6B6858] hover:text-[#122A22]'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://flagcdn.com/24x18/in.png"
            alt="India"
            className="w-5 h-auto rounded-sm shrink-0"
          />
          <span>Indian Stocks</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              market === 'IN' ? 'bg-[#122A22] text-[#F7F5EF]' : 'bg-[#EFEDE4] text-[#6B6858]'
            }`}
          >
            NSE
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMarket('US')}
          className={`flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-medium border-b-2 transition-all ${
            market === 'US'
              ? 'border-[#122A22] text-[#122A22] font-semibold bg-white/50'
              : 'border-transparent text-[#6B6858] hover:text-[#122A22]'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://flagcdn.com/24x18/us.png"
            alt="United States"
            className="w-5 h-auto rounded-sm shrink-0"
          />
          <span>US Stocks</span>
          <span
            className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
              market === 'US' ? 'bg-[#122A22] text-[#F7F5EF]' : 'bg-[#EFEDE4] text-[#6B6858]'
            }`}
          >
            NASDAQ • NYSE ($)
          </span>
        </button>
      </div>

      {/* Stock Trading Categories Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {TRADING_CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono transition-colors whitespace-nowrap border ${
                active
                  ? 'bg-[#122A22] text-[#F7F5EF] border-[#122A22]'
                  : 'bg-white text-[#6B6858] border-[#DDD8CC] hover:border-[#122A22] hover:text-[#122A22]'
              }`}
            >
              {cat.label}
            </button>
          );
        })}
        {category !== 'all' && (
          <button
            onClick={() => setCategory('all')}
            className="px-2 py-1 text-xs text-[#9B3A32] font-mono hover:underline whitespace-nowrap"
          >
            Clear Filter &times;
          </button>
        )}
      </div>

      {loading && stocks.length === 0 && <LoadingState label="Loading stocks" />}
      {!loading && error && stocks.length === 0 && <ErrorState message={error} />}
      {!loading && !error && stocks.length === 0 && (
        <EmptyState message="No stocks match your search or category filter. Try selecting 'All Stocks' or clear search." />
      )}
      {stocks.length > 0 && (
        <StockTable
          stocks={stocks}
          guest={guest}
          sortBy={sortBy}
          order={order}
          onSort={toggleSort}
          onGuestClick={() => setShowGate(true)}
          watchlistSymbols={watchlistSymbols}
          onToggleWatchlist={toggleWatchlist}
        />
      )}

      {/* Contextual Market News */}
      <ContextualMarketNews
        title="Market Wire & Corporate Disclosures"
        subtitle="Real-time announcements and news impacting listed equities"
        category={category !== 'all' ? category : 'markets'}
        limit={4}
      />

      <LoginRequired open={showGate} onClose={() => setShowGate(false)} />
    </div>
  );
}
