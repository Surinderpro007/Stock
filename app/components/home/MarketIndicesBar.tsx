'use client';

import { useMemo } from 'react';
import type { PublicStock } from '../../lib/api/stocks';
import MarketStatusBadge from '../market/MarketStatusBadge';

interface IndexCard {
  name: string;
  symbol: string;
  value: string;
  change: string;
  percent: string;
  isPositive: boolean;
  constituentsCount: number;
  topGainer?: { symbol: string; changePercent: number };
}

export default function MarketIndicesBar({ stocks = [] }: { stocks?: PublicStock[] }) {
  const indices: IndexCard[] = useMemo(() => {
    if (!stocks || stocks.length === 0) {
      return [];
    }

    // Helper to calculate basket metrics from a filtered subset of stocks
    const calcBasket = (
      name: string,
      symbol: string,
      subset: PublicStock[],
      scaleFactor = 10
    ): IndexCard => {
      if (subset.length === 0) {
        return {
          name,
          symbol,
          value: '—',
          change: '—',
          percent: '0.00%',
          isPositive: true,
          constituentsCount: 0,
        };
      }

      const totalVal = subset.reduce((acc, s) => acc + (s.currentPrice || 0), 0);
      const totalPrev = subset.reduce(
        (acc, s) => acc + (s.previousClose || s.currentPrice || 0),
        0
      );
      const avgChange = totalVal - totalPrev;
      const avgPct = totalPrev > 0 ? (avgChange / totalPrev) * 100 : 0;
      const isPositive = avgChange >= 0;

      // Find top mover in this basket
      const sorted = [...subset].sort(
        (a, b) => (b.changePercent || 0) - (a.changePercent || 0)
      );
      const topGainer = sorted[0]
        ? { symbol: sorted[0].symbol, changePercent: sorted[0].changePercent || 0 }
        : undefined;

      const basketIndexValue = (totalVal / subset.length) * scaleFactor;
      const basketIndexChange = (avgChange / subset.length) * scaleFactor;

      return {
        name,
        symbol,
        value: basketIndexValue.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
        change: `${isPositive ? '+' : ''}${basketIndexChange.toFixed(2)}`,
        percent: `${isPositive ? '+' : ''}${avgPct.toFixed(2)}%`,
        isPositive,
        constituentsCount: subset.length,
        topGainer,
      };
    };

    // 1. All-Market Composite Index (Across all listed Indian equities)
    const composite = calcBasket('NSE COMPOSITE', 'NIFTY-COMP', stocks, 10);

    // 2. Banking & Financials Basket
    const bankingStocks = stocks.filter((s) => {
      const sec = (s.sector || '').toLowerCase();
      return sec.includes('bank') || sec.includes('financial');
    });
    const banking = calcBasket('BANKING INDEX', 'BANK-BASKET', bankingStocks, 15);

    // 3. Information Technology Basket
    const itStocks = stocks.filter((s) => (s.sector || '').toLowerCase().includes('information') || (s.sector || '').toLowerCase().includes('tech'));
    const it = calcBasket('IT SECTOR INDEX', 'IT-BASKET', itStocks, 12);

    // 4. Infrastructure & Auto Basket
    const infraAutoStocks = stocks.filter((s) => {
      const sec = (s.sector || '').toLowerCase();
      return sec.includes('infra') || sec.includes('auto') || sec.includes('materials');
    });
    const infraAuto = calcBasket('INFRA & AUTO', 'INFRA-BASKET', infraAutoStocks, 8);

    return [composite, banking, it, infraAuto];
  }, [stocks]);

  if (indices.length === 0) {
    return null;
  }

  return (
    <div className="w-full mb-10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MarketStatusBadge
            market="IN"
            priceTime={stocks[0]?.priceTime}
            quoteUpdatedAt={stocks[0]?.quoteUpdatedAt}
          />
          <span className="font-mono text-xs text-[#122A22] font-medium tracking-wider uppercase">
            NSE Benchmark Baskets
          </span>
        </div>
        <span className="font-mono text-[11px] text-[#6B6858]">
          Aggregated from {stocks.length} NSE quotes
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {indices.map((idx) => (
          <div
            key={idx.symbol}
            className="p-3.5 bg-white border border-[#DDD8CC] rounded-md shadow-xs hover:border-[#B8935F] transition-all"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono font-semibold text-xs text-[#122A22]">{idx.name}</span>
              <span
                className={`font-mono text-[11px] font-semibold ${
                  idx.isPositive ? 'text-[#2F6B4F]' : 'text-[#9B3A32]'
                }`}
              >
                {idx.percent}
              </span>
            </div>
            <div className="font-mono font-medium text-base text-[#14140F] mb-1">
              {idx.value}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#6B6858]">
              <span>{idx.change} pts</span>
              {idx.topGainer && (
                <span className="text-[#2F6B4F] truncate">
                  Lead: {idx.topGainer.symbol} ({idx.topGainer.changePercent > 0 ? '+' : ''}
                  {idx.topGainer.changePercent.toFixed(1)}%)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
