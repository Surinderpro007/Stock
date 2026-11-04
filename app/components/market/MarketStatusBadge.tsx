'use client';

import { useMarketClock } from '../../hooks/useMarketClock';
import { getMarketStatus, isQuoteLive, liveLabel } from '../../../lib/marketStatus';

export default function MarketStatusBadge({
  market = 'IN',
  priceTime,
  quoteUpdatedAt,
  lastUpdated,
}: {
  market?: 'IN' | 'US' | string;
  priceTime?: string | Date | null;
  quoteUpdatedAt?: string | Date | null;
  lastUpdated?: Date | null;
}) {
  const nowMs = useMarketClock();
  const now = new Date(nowMs);
  const status = getMarketStatus(market, now);
  const live =
  status.isOpen &&
  isQuoteLive({
    priceTime,
    quoteUpdatedAt: quoteUpdatedAt || lastUpdated,
    now,
  });
  const label = liveLabel(status, live);
  const ping = live;

  return (
    <div className="flex items-center gap-2" title={`${status.hoursLabel}${status.holidayName ? ` · ${status.holidayName}` : ''}`}>
      <span className="relative flex h-2 w-2">
        {ping ? (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        ) : null}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            live ? 'bg-emerald-500' : status.isOpen ? 'bg-amber-500' : 'bg-[#9B9B8C]'
          }`}
        ></span>
      </span>
      <span className="text-xs font-mono font-medium text-[#122A22]">{label}</span>
    </div>
  );
}