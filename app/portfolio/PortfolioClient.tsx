'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginRequired from '../components/auth/LoginRequired';
import HoldingsTable from '../components/portfolio/HoldingsTable';
import PendingOrdersTable from '../components/portfolio/PendingOrdersTable';
import SummaryCards from '../components/portfolio/SummaryCards';
import ContextualMarketNews from '../components/news/ContextualMarketNews';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import { usePortfolio } from '../hooks/usePortfolio';
import MarketStatusBadge from '../components/market/MarketStatusBadge';

export default function PortfolioClient() {
  const { portfolio, loading, refreshing, lastUpdated, error, status, reload } = usePortfolio();
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'pending') {
        setActiveTab('pending');
      }
    }
  }, []);

  if (status === 401) {
    return <LoginRequired open />;
  }

  const holdingsCount = portfolio?.holdings?.length ?? 0;
  const pendingCount = portfolio?.pendingOrders?.length ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase">Portfolio</p>
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
            title="Recalculate portfolio and evaluate pending orders with latest live quotes"
          >
            <span className={loading || refreshing ? 'animate-spin inline-block' : ''}>↻</span>
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[#14140F]">Your portfolio</h1>
          <p className="text-sm text-[#6B6858] mt-1">
            Monitor active holdings, pending limit orders, and practice portfolio performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/wallet"
            className="text-xs font-mono px-3 py-1.5 rounded border border-[#DDD8CC] text-[#122A22] hover:bg-[#EFEDE4] transition-colors"
          >
            Wallet Cash →
          </Link>
          <Link
            href="/transactions"
            className="text-xs font-mono px-3 py-1.5 rounded border border-[#DDD8CC] text-[#122A22] hover:bg-[#EFEDE4] transition-colors"
          >
            Transaction history
          </Link>
        </div>
      </div>

      {loading && !portfolio && <LoadingState label="Loading portfolio" />}
      {!loading && error && !portfolio && <ErrorState message={error} />}

      {portfolio && (
        <>
          <SummaryCards portfolio={portfolio} />

          {/* All / Pending Tabs */}
          <div className="flex items-center justify-between border-b border-[#DDD8CC] mb-6 mt-8">
            <div className="flex gap-2 -mb-px">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition-colors ${
                  activeTab === 'all'
                    ? 'border-[#122A22] text-[#122A22] font-semibold'
                    : 'border-transparent text-[#6B6858] hover:text-[#122A22]'
                }`}
              >
                <span>All</span>
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'all'
                      ? 'bg-[#122A22] text-[#F7F5EF]'
                      : 'bg-[#EFEDE4] text-[#6B6858]'
                  }`}
                >
                  {holdingsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pending')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-medium border-b-2 transition-colors ${
                  activeTab === 'pending'
                    ? 'border-[#122A22] text-[#122A22] font-semibold'
                    : 'border-transparent text-[#6B6858] hover:text-[#122A22]'
                }`}
              >
                <span>Pending</span>
                {pendingCount > 0 ? (
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                      activeTab === 'pending'
                        ? 'bg-[#B8935F] text-white'
                        : 'bg-[#B8935F]/20 text-[#B8935F] font-bold'
                    }`}
                  >
                    {pendingCount}
                  </span>
                ) : (
                  <span className="text-[11px] px-1.5 py-0.2 rounded-full font-mono bg-[#EFEDE4] text-[#6B6858]">
                    0
                  </span>
                )}
              </button>
            </div>

            <div className="text-xs font-mono text-[#6B6858] hidden sm:block">
              {activeTab === 'all'
                ? `${holdingsCount} completed holding${holdingsCount === 1 ? '' : 's'}`
                : `${pendingCount} pending limit order${pendingCount === 1 ? '' : 's'}`}
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'all' ? (
            <HoldingsTable holdings={portfolio.holdings} />
          ) : (
            <PendingOrdersTable orders={portfolio.pendingOrders || []} onCancelled={reload} />
          )}

          {/* Contextual Market News */}
          <div className="mt-12">
            <ContextualMarketNews
              title="Portfolio & Earnings News Wire"
              subtitle="Corporate results, dividend notices, and market analysis relevant to your equity holdings"
              category="earnings"
              limit={4}
            />
          </div>
        </>
      )}
    </div>
  );
}
