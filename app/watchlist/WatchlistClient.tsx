'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import LoginRequired from '../components/auth/LoginRequired';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import PriceChange from '../components/stocks/PriceChange';
import StockLogo from '../components/stocks/StockLogo';
import WatchlistButton from '../components/stocks/WatchlistButton';
import ContextualMarketNews from '../components/news/ContextualMarketNews';
import { useWatchlist } from '../hooks/useWatchlist';
import { formatPrice } from '../lib/formatMoney';
import MarketStatusBadge from '../components/market/MarketStatusBadge';

export default function WatchlistClient() {
  const router = useRouter();
  const {
    watchlist,
    symbols,
    toggle,
    loading,
    refreshing,
    error,
    status,
    lastUpdated,
    reload,
  } = useWatchlist();

  if (status === 401) {
    return <LoginRequired open />;
  }

  const handleRowClick = (symbol: string) => {
    router.push(`/stocks/${symbol}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Top status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase">
          Saved Equities
        </p>
        <div className="flex items-center gap-3">
          <MarketStatusBadge lastUpdated={lastUpdated} />
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
            title="Refresh watchlist quotes"
          >
            <span className={loading || refreshing ? 'animate-spin inline-block' : ''}>↻</span>
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Main Title */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[#14140F]">Watchlist</h1>
          <p className="text-sm text-[#6B6858] mt-1">
            Track and monitor your selected Indian and US listed companies in real time
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/stocks"
            className="px-4 py-2 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md hover:bg-[#0D1F19] transition-colors shadow-xs"
          >
            + Add More Stocks
          </Link>
          <Link
            href="/portfolio"
            className="px-4 py-2 text-xs font-mono border border-[#DDD8CC] text-[#122A22] rounded-md hover:bg-[#EFEDE4] transition-colors"
          >
            View Portfolio
          </Link>
        </div>
      </div>

      {loading && watchlist.length === 0 && <LoadingState label="Loading your watchlist..." />}
      {!loading && error && watchlist.length === 0 && <ErrorState message={error} />}

      {!loading && !error && watchlist.length === 0 && (
        <div className="border border-[#DDD8CC] rounded-md bg-white p-12 text-center shadow-xs">
          <div className="text-3xl text-[#B8935F] mb-3">★</div>
          <h3 className="font-serif text-xl text-[#14140F] mb-2">Your watchlist is empty</h3>
          <p className="text-sm text-[#6B6858] max-w-md mx-auto mb-6">
            Click the star icon next to any stock in the market list or detail page to pin it to your personal watchlist.
          </p>
          <Link
            href="/stocks"
            className="px-5 py-2.5 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md hover:bg-[#0D1F19] transition-colors inline-block"
          >
            Explore Listed Stocks →
          </Link>
        </div>
      )}

      {watchlist.length > 0 && (
        <div className="border border-[#DDD8CC] rounded-md bg-white overflow-hidden shadow-xs mb-8">
          {/* Desktop & Tablet Table (sm and up) - Fits 100% width with zero horizontal scrollbar */}
          <div className="hidden sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDD8CC] text-left text-xs font-mono tracking-wide uppercase text-[#6B6858]">
                  <th className="px-3 py-3 w-10 text-center">Pin</th>
                  <th className="px-4 py-3">Company & Symbol</th>
                  <th className="px-4 py-3 whitespace-nowrap">Sector</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Price</th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">Day Change</th>
                  <th className="px-4 py-3 text-right w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {watchlist.map((stock) => {
                  const isUsd = stock.currency === 'USD';
                  return (
                    <tr
                      key={stock.symbol}
                      onClick={() => handleRowClick(stock.symbol)}
                      className="border-b border-[#EFEDE4] last:border-0 hover:bg-[#FBF9F4] cursor-pointer transition-colors group"
                      title={`Open ${stock.symbol} chart & trade pad`}
                    >
                      <td className="px-3 py-3 text-center w-10" onClick={(e) => e.stopPropagation()}>
                        <WatchlistButton
                          symbol={stock.symbol}
                          isWatched={symbols.includes(stock.symbol)}
                          onToggle={toggle}
                        />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <StockLogo
                            name={stock.companyName}
                            logoUrl={stock.logoUrl}
                            symbol={stock.symbol}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-[#122A22] group-hover:text-[#B8935F] transition-colors block">
                                {stock.symbol}
                              </span>
                              {isUsd && (
                                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#EFEDE4] text-[#6B6858] font-normal">
                                  US ($)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#6B6858] font-medium truncate max-w-[140px] md:max-w-[220px]">
                              {stock.companyName}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Single-line Sector badge with ample width and no wrapping */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-block whitespace-nowrap text-xs font-mono px-2.5 py-0.5 rounded bg-[#F7F5EF] text-[#122A22] border border-[#DDD8CC]">
                          {stock.sector}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono font-medium text-right text-base text-[#14140F] whitespace-nowrap">
                        {formatPrice(stock.currentPrice, stock.currency || 'INR')}
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <PriceChange
                          amount={stock.changeAmount}
                          percent={stock.changePercent}
                          currency={stock.currency || 'INR'}
                        />
                      </td>

                      <td className="px-4 py-3 text-right w-24 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/stocks/${stock.symbol}`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-mono font-medium rounded bg-[#122A22] text-[#F7F5EF] hover:bg-[#0D1F19] transition-colors shadow-xs"
                          title={`Open chart and trade ${stock.symbol}`}
                        >
                          <span>Trade</span>
                          <span className="text-[#B8935F]">↗</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout (< sm) - Responsive stack, zero horizontal scrollbar */}
          <div className="sm:hidden divide-y divide-[#EFEDE4]">
            {watchlist.map((stock) => {
              const isUsd = stock.currency === 'USD';
              return (
                <div
                  key={stock.symbol}
                  onClick={() => handleRowClick(stock.symbol)}
                  className="p-4 hover:bg-[#FBF9F4] cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div onClick={(e) => e.stopPropagation()}>
                        <WatchlistButton
                          symbol={stock.symbol}
                          isWatched={symbols.includes(stock.symbol)}
                          onToggle={toggle}
                        />
                      </div>
                      <StockLogo
                        name={stock.companyName}
                        logoUrl={stock.logoUrl}
                        symbol={stock.symbol}
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-sm text-[#122A22] block">
                            {stock.symbol}
                          </span>
                          {isUsd && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#EFEDE4] text-[#6B6858] font-normal">
                              US ($)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B6858] truncate max-w-[150px]">
                          {stock.companyName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-medium text-sm text-[#14140F]">
                        {formatPrice(stock.currentPrice, stock.currency || 'INR')}
                      </div>
                      <PriceChange
                        amount={stock.changeAmount}
                        percent={stock.changePercent}
                        currency={stock.currency || 'INR'}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#F7F5EF]">
                    <span className="inline-block whitespace-nowrap text-[11px] font-mono px-2 py-0.5 rounded bg-[#F7F5EF] text-[#122A22] border border-[#DDD8CC]">
                      {stock.sector}
                    </span>
                    <Link
                      href={`/stocks/${stock.symbol}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-mono font-medium rounded bg-[#122A22] text-[#F7F5EF] hover:bg-[#0D1F19]"
                    >
                      <span>Trade</span>
                      <span className="text-[#B8935F]">↗</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contextual Market News */}
      <ContextualMarketNews
        title="Watchlist & Market Intelligence Wire"
        subtitle="Announcements, earnings updates, and price movements across monitored equities"
        limit={4}
      />
    </div>
  );
}
