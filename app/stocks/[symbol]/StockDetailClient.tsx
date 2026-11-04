'use client';

import { useState } from 'react';
import Link from 'next/link';
import LoginRequired from '../../components/auth/LoginRequired';
import ErrorState from '../../components/ui/ErrorState';
import LoadingState from '../../components/ui/LoadingState';
import PriceChange from '../../components/stocks/PriceChange';
import StockChart from '../../components/stocks/StockChart';
import StockLogo from '../../components/stocks/StockLogo';
import TradeForm from '../../components/stocks/TradeForm';
import WatchlistButton from '../../components/stocks/WatchlistButton';
import ContextualMarketNews from '../../components/news/ContextualMarketNews';
import { useStockDetail } from '../../hooks/useStockDetail';
import { useWatchlist } from '../../hooks/useWatchlist';
import { formatMarketCap, formatPrice, formatRupee, formatVolume } from '../../lib/formatMoney';
import { formatMarketTime } from '../../../lib/formatDate';
import MarketStatusBadge from '../../components/market/MarketStatusBadge';
import { isMarketOpen } from '../../../lib/marketStatus';

function StatCard({
  label,
  value,
  subvalue,
}: {
  label: string;
  value: string;
  subvalue?: string;
}) {
  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white p-4 shadow-xs">
      <p className="font-mono text-[10px] tracking-[0.2em] text-[#B8935F] uppercase mb-1">
        {label}
      </p>
      <p className="text-base font-semibold text-[#14140F] font-mono">{value}</p>
      {subvalue && <p className="text-[11px] text-[#6B6858] mt-0.5">{subvalue}</p>}
    </div>
  );
}

function RangeBar({
  label,
  low,
  high,
  current,
  currency = 'INR',
}: {
  label: string;
  low: number;
  high: number;
  current: number;
  currency?: string;
}) {
  const range = high - low;
  const pct = range > 0 ? Math.min(100, Math.max(0, ((current - low) / range) * 100)) : 50;

  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white p-4 shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[10px] tracking-[0.2em] text-[#B8935F] uppercase">
          {label}
        </span>
        <span className="font-mono text-xs text-[#14140F] font-medium">
          {formatPrice(current, currency)}
        </span>
      </div>

      <div className="relative w-full h-2 bg-[#EFEDE4] rounded-full overflow-visible my-3">
        <div
          className="h-full bg-gradient-to-r from-emerald-400 to-[#122A22] rounded-full"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 -mt-2 -ml-2 w-4 h-4 rounded-full bg-[#122A22] border-2 border-white shadow-sm"
          style={{ left: `${pct}%` }}
          title={`Current: ${formatPrice(current, currency)}`}
        />
      </div>

      <div className="flex items-center justify-between text-xs font-mono text-[#6B6858]">
        <div>
          <span className="block text-[10px] uppercase text-[#8E8B7B]">Low</span>
          <span>{formatPrice(low, currency)}</span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] uppercase text-[#8E8B7B]">High</span>
          <span>{formatPrice(high, currency)}</span>
        </div>
      </div>
    </div>
  );
}

export default function StockDetailClient({ symbol }: { symbol: string }) {
  const {
    stock,
    guest,
    forex,
    history,
    range,
    setRange,
    loading,
    refreshing,
    lastUpdated,
    historyLoading,
    error,
    reload,
  } = useStockDetail(symbol);

  const { isWatchlisted, toggle } = useWatchlist();
  const [showGate, setShowGate] = useState(false);

  if (loading && !stock) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <LoadingState label="Loading stock intelligence..." />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16">
        <ErrorState message={error || 'Stock not found'} />
      </div>
    );
  }

  const isWatched = isWatchlisted(stock.symbol);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Top breadcrumb and live feed status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-[#EFEDE4]">
        <div className="flex items-center gap-3">
          <Link
            href="/stocks"
            className="text-xs font-mono text-[#6B6858] hover:text-[#122A22] flex items-center gap-1 transition-colors"
          >
            <span>←</span>
            <span>Back to Listed Stocks</span>
          </Link>
          <span className="text-[#DDD8CC]">•</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#F7F5EF] text-[#122A22] border border-[#DDD8CC]">
            {stock.exchange || (stock.market === 'US' ? 'NASDAQ' : 'NSE')}: {stock.symbol}
          </span>
        </div>

        <MarketStatusBadge
          market={stock.market === 'US' ? 'US' : 'IN'}
          priceTime={stock.priceTime}
          quoteUpdatedAt={stock.quoteUpdatedAt}
          lastUpdated={lastUpdated}
        />
      </div>

      {/* Stock Main Header Banner */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <StockLogo
            name={stock.companyName}
            logoUrl={stock.logoUrl}
            symbol={stock.symbol}
            size="lg"
          />
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="font-serif text-3xl font-semibold text-[#14140F]">{stock.symbol}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#122A22] text-[#F7F5EF]">
                {stock.sector}
              </span>
              {stock.exchange && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#FAF9F5] text-[#6B6858] border border-[#DDD8CC]">
                  {stock.exchange}
                </span>
              )}
              {/* Watchlist Star Toggle */}
              <div className="border border-[#DDD8CC] rounded px-2.5 py-0.5 bg-white shadow-xs">
                <WatchlistButton
                  symbol={stock.symbol}
                  isWatched={isWatched}
                  onToggle={toggle}
                  guest={guest}
                  onGuestClick={() => setShowGate(true)}
                  showLabel
                />
              </div>
            </div>
            <p className="text-base text-[#6B6858] font-medium">{stock.companyName}</p>
          </div>
        </div>

        {/* Live Price Display */}
        <div className="text-left md:text-right bg-white md:bg-transparent p-4 md:p-0 rounded-md border md:border-0 border-[#DDD8CC]">
          <div className="font-serif text-4xl font-semibold text-[#14140F] mb-1">
            {formatPrice(stock.currentPrice, stock.currency || 'INR')}
          </div>
          <div className="flex items-center md:justify-end gap-2">
            <PriceChange
              amount={stock.changeAmount}
              percent={stock.changePercent}
              currency={stock.currency || 'INR'}
            />
          </div>
          {stock.priceTime && (
            <p className="font-mono text-[11px] text-[#6B6858] mt-1.5">
              {isMarketOpen(stock.market === 'US' ? 'US' : 'IN') ? 'Quote as of' : 'Last quote'}{' '}
              {formatMarketTime(stock.priceTime)}
            </p>
          )}
        </div>
      </div>

      {/* Chart and Trade Pad Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Chart Column */}
        <div className="lg:col-span-2">
          <StockChart
            history={history}
            range={range}
            onRangeChange={setRange}
            loading={historyLoading}
          />
        </div>

        {/* Trade Form Column */}
        <div>
          <TradeForm
            symbol={stock.symbol}
            currentPrice={stock.currentPrice}
            currency={stock.currency || 'INR'}
            exchange={stock.exchange || (stock.market === 'US' ? 'NASDAQ' : 'NSE')}
            market={stock.market === 'US' ? 'US' : 'IN'}
            initialForex={forex}
            onComplete={reload}
            guest={guest}
            onGuestClick={() => setShowGate(true)}
          />
        </div>
      </div>

      {/* Professional Key Statistics Grid */}
      <div className="mb-8">
        <h2 className="font-serif text-xl text-[#14140F] mb-4">Key Market Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
          <StatCard
            label="Open"
            value={formatPrice(stock.openPrice || stock.previousClose, stock.currency || 'INR')}
          />
          <StatCard
            label="Prev Close"
            value={formatPrice(stock.previousClose, stock.currency || 'INR')}
          />
          <StatCard
            label="Day High"
            value={formatPrice(stock.dayHigh, stock.currency || 'INR')}
          />
          <StatCard
            label="Day Low"
            value={formatPrice(stock.dayLow, stock.currency || 'INR')}
          />
          <StatCard
            label="Volume"
            value={formatVolume(stock.volume)}
          />
          <StatCard
            label="Market Cap"
            value={formatMarketCap(stock.marketCap, stock.currency || 'INR')}
          />
        </div>

        {/* Visual Range Sliders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RangeBar
            label="Today's Trading Range"
            low={stock.dayLow}
            high={stock.dayHigh}
            current={stock.currentPrice}
            currency={stock.currency || 'INR'}
          />
          <RangeBar
            label="52-Week Range"
            low={stock.week52Low}
            high={stock.week52High}
            current={stock.currentPrice}
            currency={stock.currency || 'INR'}
          />
        </div>
      </div>

      {/* Company Profile Description */}
      <div className="border border-[#DDD8CC] rounded-md bg-white p-6 shadow-xs mb-8">
        <div className="flex items-center justify-between mb-3 border-b border-[#EFEDE4] pb-3">
          <h2 className="font-serif text-xl text-[#14140F]">About {stock.companyName}</h2>
          <span className="text-xs font-mono text-[#B8935F] uppercase tracking-wider">
            Sector: {stock.sector}
          </span>
        </div>
        <p className="text-sm text-[#6B6858] leading-relaxed">
          {stock.description}
        </p>
      </div>

      {/* Contextual Real-time News Wire for this Stock */}
      <ContextualMarketNews
        symbol={stock.symbol}
        title={`${stock.companyName} (${stock.symbol}) News Wire`}
        subtitle={`Exchange disclosures, market commentary, and developments for ${stock.symbol}`}
        limit={4}
      />

      {/* Login Required modal for guest users executing protected actions */}
      <LoginRequired open={showGate} onClose={() => setShowGate(false)} />
    </div>
  );
}
