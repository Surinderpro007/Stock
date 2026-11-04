'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useNews } from '../hooks/useNews';
import LoadingState from '../components/ui/LoadingState';
import ErrorState from '../components/ui/ErrorState';
import EmptyState from '../components/ui/EmptyState';
import { useMarketStatus } from '../hooks/useMarketStatus';

const CATEGORIES = [
  { id: 'all', label: 'All News' },
  { id: 'markets', label: 'Markets & Nifty' },
  { id: 'earnings', label: 'Earnings & Results' },
  { id: 'economy', label: 'Economy & RBI' },
  { id: 'corporates', label: 'Corporates' },
  { id: 'ipo', label: 'IPO & Listings' },
];

export default function NewsClient() {
  const {
    news,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    loading,
    refreshing,
    lastUpdated,
    error,
    reload,
  } = useNews('all', '', 30);

  // Use real market status — NSE is the primary market for this news feed
  const nseStatus = useMarketStatus('IN');
  const usStatus = useMarketStatus('US');
  // News feed is "live" only when at least one market is open
  const anyMarketOpen = nseStatus.isOpen || usStatus.isOpen;

  const [inputVal, setInputVal] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputVal.trim());
  };

  const handleClearSearch = () => {
    setInputVal('');
    setSearchQuery('');
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Top status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase">
          Live Wire
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {anyMarketOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  anyMarketOpen ? 'bg-emerald-500' : 'bg-[#9B9B8C]'
                }`}
              ></span>
            </span>
            <span className="text-xs font-mono font-medium text-[#122A22]">
              {anyMarketOpen
                ? nseStatus.isOpen
                  ? 'NSE Open · Live News Feed'
                  : 'NASDAQ Open · Live News Feed'
                : 'Market Closed · Latest News'}
            </span>
          </div>
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
            title="Fetch latest market news"
          >
            <span className={loading || refreshing ? 'animate-spin inline-block' : ''}>↻</span>
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Main Page Title */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-3xl text-[#14140F]">Financial News & Insights</h1>
          <p className="text-sm text-[#6B6858] mt-1">
            Real-time corporate announcements, macro developments, and market intelligence
          </p>
        </div>

        {/* Search input form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full md:w-80">
          <input
            type="search"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Search news or ticker..."
            className="w-full border border-[#DDD8CC] rounded-md px-3 py-2 text-sm bg-white text-[#14140F] focus:outline-none focus:ring-1 focus:ring-[#122A22]"
          />
          <button
            type="submit"
            className="px-3.5 py-2 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md hover:bg-[#0D1F19] transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                if (searchQuery) handleClearSearch();
              }}
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
        {searchQuery && (
          <button
            onClick={handleClearSearch}
            className="px-2.5 py-1 text-xs text-[#9B3A32] font-mono hover:underline whitespace-nowrap"
          >
            Clear Search &times;
          </button>
        )}
      </div>

      {/* Content states */}
      {loading && news.length === 0 && <LoadingState label="Fetching live financial wire..." />}
      {!loading && error && news.length === 0 && <ErrorState message={error} />}
      {!loading && !error && news.length === 0 && (
        <EmptyState message="No news stories found matching your filter. Try another category or search term." />
      )}

      {/* News Grid */}
      {news.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {news.map((item) => (
            <article
              key={item.id}
              className="border border-[#DDD8CC] rounded-md bg-white p-5 shadow-xs hover:border-[#B8935F] hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 text-xs font-mono text-[#6B6858]">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[#122A22] px-2 py-0.5 rounded bg-[#F7F5EF] border border-[#DDD8CC]">
                      {item.source}
                    </span>
                    <span className="text-[11px] text-[#B8935F] font-mono uppercase tracking-wide">
                      {item.category}
                    </span>
                  </div>
                  <span>{item.timeAgo}</span>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-serif text-lg text-[#14140F] hover:text-[#122A22] hover:underline leading-snug mb-2 font-medium"
                >
                  {item.title}
                  <span className="inline-block ml-1 text-xs text-[#B8935F]">↗</span>
                </a>

                {item.snippet && (
                  <p className="text-xs text-[#6B6858] leading-relaxed mb-3 line-clamp-3">
                    {item.snippet}
                  </p>
                )}
              </div>

              {item.symbols && item.symbols.length > 0 && (
                <div className="pt-3 border-t border-[#EFEDE4] flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-[#6B6858]">Related Stocks:</span>
                  {item.symbols.map((sym) => (
                    <Link
                      key={sym}
                      href={`/stocks/${sym}`}
                      className="text-xs font-mono px-2 py-0.5 bg-[#122A22] text-[#F7F5EF] rounded hover:bg-[#0D1F19] transition-colors"
                    >
                      {sym}
                    </Link>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
