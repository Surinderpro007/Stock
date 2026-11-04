'use client';

import Link from 'next/link';
import { formatPrice } from '../../lib/formatMoney';
import type { PublicStock } from '../../lib/api/stocks';
import PriceChange from './PriceChange';
import StockLogo from './StockLogo';
import WatchlistButton from './WatchlistButton';

function SortButton({
  label,
  field,
  active,
  order,
  onClick,
  align = 'left',
}: {
  label: string;
  field: string;
  active: boolean;
  order: string;
  onClick: (field: string) => void;
  align?: 'left' | 'right';
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(field)}
      className={`text-xs font-mono tracking-wide uppercase ${
        align === 'right' ? 'text-right w-full' : 'text-left'
      } ${active ? 'text-[#122A22]' : 'text-[#6B6858]'} hover:text-[#B8935F]`}
    >
      {label}
      {active ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
    </button>
  );
}

export default function StockTable({
  stocks,
  guest,
  sortBy,
  order,
  onSort,
  onGuestClick,
  watchlistSymbols = [],
  onToggleWatchlist,
}: {
  stocks: PublicStock[];
  guest: boolean;
  sortBy: string;
  order: string;
  onSort: (field: string) => void;
  onGuestClick: () => void;
  watchlistSymbols?: string[];
  onToggleWatchlist?: (symbol: string) => Promise<any> | void;
}) {
  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white overflow-hidden shadow-xs">
      {/* Table Header */}
      <div className="hidden md:grid grid-cols-12 px-5 py-3 border-b border-[#DDD8CC] items-center text-xs font-mono text-[#6B6858]">
        <div className="col-span-1 text-center">
          <span className="uppercase tracking-wide">Watch</span>
        </div>
        <div className="col-span-2">
          <SortButton label="Symbol" field="symbol" active={sortBy === 'symbol'} order={order} onClick={onSort} />
        </div>
        <div className="col-span-3">
          <SortButton label="Company" field="name" active={sortBy === 'name'} order={order} onClick={onSort} />
        </div>
        <div className="col-span-3">
          <span className="uppercase tracking-wide">Category</span>
        </div>
        <div className="col-span-3 text-right">
          <div className="flex justify-end gap-6">
            <SortButton
              label="Price"
              field="price"
              active={sortBy === 'price'}
              order={order}
              onClick={onSort}
              align="right"
            />
            <SortButton
              label="Day change"
              field="change"
              active={sortBy === 'change'}
              order={order}
              onClick={onSort}
              align="right"
            />
          </div>
        </div>
      </div>

      {/* Rows */}
      <ul>
        {stocks.map((stock) => {
          const isWatched = watchlistSymbols.includes(stock.symbol);

          return (
            <li key={stock.symbol} className="border-b border-[#EFEDE4] last:border-b-0">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-0 px-5 py-4 hover:bg-[#FBF9F4] transition-colors md:items-center">
                {/* Watchlist pin */}
                <div className="hidden md:flex col-span-1 justify-center">
                  <WatchlistButton
                    symbol={stock.symbol}
                    isWatched={isWatched}
                    onToggle={onToggleWatchlist || (() => {})}
                    guest={guest}
                    onGuestClick={onGuestClick}
                  />
                </div>

                {/* Symbol & Logo */}
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="col-span-2 flex items-center gap-3 group"
                >
                  <StockLogo name={stock.companyName} logoUrl={stock.logoUrl} symbol={stock.symbol} />
                  <div>
                    <span className="font-mono text-sm font-semibold text-[#122A22] group-hover:text-[#B8935F] transition-colors">
                      {stock.symbol}
                    </span>
                    <div className="md:hidden text-xs text-[#6B6858] truncate">{stock.companyName}</div>
                  </div>
                </Link>

                {/* Company Name */}
                <Link
                  href={`/stocks/${stock.symbol}`}
                  className="hidden md:block col-span-3 text-sm text-[#14140F] hover:text-[#B8935F] truncate"
                >
                  {stock.companyName}
                </Link>

                {/* Sector / Category badge with generous width and no-wrap */}
                <div className="col-span-3 flex items-center gap-1.5 flex-wrap">
                  {stock.sector ? (
                    <span className="inline-block whitespace-nowrap text-xs font-mono px-2.5 py-0.5 rounded bg-[#F7F5EF] text-[#122A22] border border-[#DDD8CC]">
                      {stock.sector}
                    </span>
                  ) : null}
                  {stock.exchange && (
                    <span className="inline-block whitespace-nowrap text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-[#6B6858] border border-[#DDD8CC]">
                      {stock.exchange}
                    </span>
                  )}
                </div>

                {/* Price and Day Change */}
                <div className="col-span-3 flex md:justify-end items-center justify-between gap-6">
                  <span className="text-sm font-mono font-medium text-[#122A22] whitespace-nowrap">
                    {formatPrice(stock.currentPrice, stock.currency || 'INR')}
                  </span>
                  <div className="whitespace-nowrap">
                    <PriceChange
                      amount={stock.changeAmount}
                      percent={stock.changePercent}
                      currency={stock.currency || 'INR'}
                    />
                  </div>
                  {/* Mobile Watchlist Star */}
                  <div className="md:hidden">
                    <WatchlistButton
                      symbol={stock.symbol}
                      isWatched={isWatched}
                      onToggle={onToggleWatchlist || (() => {})}
                      guest={guest}
                      onGuestClick={onGuestClick}
                    />
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
