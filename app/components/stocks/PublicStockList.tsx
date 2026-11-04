'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import LoginRequired from '../auth/LoginRequired';
import { formatPrice } from '../../lib/formatMoney';
import PriceChange from './PriceChange';
import StockLogo from './StockLogo';
import { fetchStocks, type PublicStock } from '../../lib/api/stocks';
import { useWhenMarketOpen } from '../../hooks/useWhenMarketOpen';
import MarketStatusBadge from '../market/MarketStatusBadge';

const REFRESH_INTERVAL_MS = 10_000;

export default function PublicStockList({
  stocks: initialStocks,
  isLoggedIn,
}: {
  stocks: PublicStock[];
  isLoggedIn: boolean;
}) {
  const [stocks, setStocks] = useState<PublicStock[]>(initialStocks);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showLoginGate, setShowLoginGate] = useState(false);

  const refreshStocks = useCallback(async (silent = false) => {
    if (!silent) {
      setIsRefreshing(true);
    }
    try {
      const data = await fetchStocks({ limit: 8, market: 'IN', sortBy: 'symbol', order: 'asc' });
      if (data?.stocks?.length) {
        setStocks(data.stocks);
        setLastUpdated(new Date());
      }
    } catch {
      // Keep showing current stocks on failure
    } finally {
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  }, []);

  // Set initial update time
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  const silentRefresh = useCallback(() => {
    refreshStocks(true);
  }, [refreshStocks]);

  useWhenMarketOpen(silentRefresh, { market: 'IN', intervalMs: REFRESH_INTERVAL_MS });

  function handleStockClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (isLoggedIn) {
      return;
    }

    event.preventDefault();
    setShowLoginGate(true);
  }

  if (!stocks.length) {
    return (
      <div className="border border-[#DDD8CC] rounded-md bg-white px-6 py-10 text-center">
        <p className="text-sm text-[#6B6858]">
          No listed stocks yet. Run <span className="font-mono">npm run seed:stocks</span> to load
          the market.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-[#DDD8CC] rounded-md bg-white overflow-hidden shadow-xs">
        {/* Dynamic Live Status Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 bg-[#FAF9F5] border-b border-[#DDD8CC] text-xs">
          <div className="flex items-center gap-2">
            <MarketStatusBadge
              market="IN"
              priceTime={stocks[0]?.priceTime}
              quoteUpdatedAt={stocks[0]?.quoteUpdatedAt}
              lastUpdated={lastUpdated}
            />
            {lastUpdated && (
              <span className="text-[#6B6858] font-mono text-[10px] hidden sm:inline">
                • Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => refreshStocks(false)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#122A22] bg-white hover:bg-[#EFEDE4] border border-[#DDD8CC] rounded transition-colors disabled:opacity-50"
            title="Fetch latest prices via API"
          >
            <span className={isRefreshing ? 'animate-spin inline-block' : ''}>↻</span>
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>

        <div className="hidden sm:grid grid-cols-12 px-5 py-3 border-b border-[#DDD8CC] text-xs font-mono tracking-wide uppercase text-[#6B6858]">
          <span className="col-span-3">Symbol</span>
          <span className="col-span-4">Company</span>
          <span className="col-span-2 text-right">Price</span>
          <span className="col-span-3 text-right">Day Change</span>
        </div>

        <ul>
          {stocks.map((stock) => (
            <li key={stock.symbol} className="border-b border-[#EFEDE4] last:border-b-0">
              <Link
                href={`/stocks/${stock.symbol}`}
                onClick={handleStockClick}
                className="grid grid-cols-1 sm:grid-cols-12 gap-1 sm:gap-0 px-5 py-4 hover:bg-[#F7F5EF] transition-colors items-center"
              >
                <span className="sm:col-span-3 flex items-center gap-3">
                  <StockLogo name={stock.companyName} logoUrl={stock.logoUrl} symbol={stock.symbol} />
                  <div>
                    <span className="font-mono text-sm font-semibold text-[#122A22] block">{stock.symbol}</span>
                    <span className="text-[11px] text-[#6B6858] font-mono sm:hidden">{stock.companyName}</span>
                  </div>
                </span>
                <span className="sm:col-span-4 text-sm text-[#14140F] hidden sm:block truncate pr-2">
                  {stock.companyName}
                </span>
                <span className="sm:col-span-2 sm:text-right text-sm font-medium text-[#122A22]">
                  {formatPrice(stock.currentPrice, stock.currency || 'INR')}
                </span>
                <span className="sm:col-span-3 sm:text-right text-sm">
                  <PriceChange
                    amount={stock.changeAmount}
                    percent={stock.changePercent}
                    currency={stock.currency || 'INR'}
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <LoginRequired open={showLoginGate} onClose={() => setShowLoginGate(false)} />
    </>
  );
}
