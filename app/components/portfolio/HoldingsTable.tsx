'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPercent, formatPrice, formatRupee, formatSignedRupee } from '../../lib/formatMoney';
import type { HoldingRow } from '../../lib/api/portfolio';
import EmptyState from '../ui/EmptyState';
import StockLogo from '../stocks/StockLogo';

export default function HoldingsTable({ holdings }: { holdings: HoldingRow[] }) {
  const router = useRouter();

  if (!holdings.length) {
    return (
      <EmptyState
        message="No holdings yet. Open a stock and place a virtual buy order to see your portfolio here."
      />
    );
  }

  const handleRowClick = (symbol: string) => {
    router.push(`/stocks/${symbol}`);
  };

  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white overflow-x-auto shadow-xs">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#DDD8CC] text-left text-xs font-mono tracking-wide uppercase text-[#6B6858]">
            <th className="px-4 py-3">Company & Symbol</th>
            <th className="px-4 py-3 text-right sm:text-left">Qty</th>
            <th className="px-4 py-3 text-right sm:text-left">Avg Buy Price</th>
            <th className="px-4 py-3 text-right sm:text-left">Current Price</th>
            <th className="px-4 py-3 text-right sm:text-left">Invested (INR)</th>
            <th className="px-4 py-3 text-right sm:text-left">Current Value</th>
            <th className="px-4 py-3 text-right sm:text-left">Total P&L</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((row) => {
            const up = row.profitLossAmount >= 0;
            const isUsd = row.currency === 'USD';
            const formattedQty = Number.isInteger(row.quantity)
              ? row.quantity
              : row.quantity.toFixed(4);

            return (
              <tr
                key={row.symbol}
                onClick={() => handleRowClick(row.symbol)}
                className="border-b border-[#EFEDE4] last:border-0 hover:bg-[#FBF9F4] cursor-pointer transition-colors group"
                title={`Click to open ${row.symbol} chart and buy/sell`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <StockLogo name={row.companyName} logoUrl={row.logoUrl} symbol={row.symbol} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-[#122A22] group-hover:text-[#B8935F] transition-colors">
                          {row.symbol}
                        </span>
                        {isUsd && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#EFEDE4] text-[#6B6858] font-normal">
                            US ($)
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B6858] font-medium">{row.companyName}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 font-mono font-medium text-right sm:text-left">
                  {formattedQty}
                </td>

                <td className="px-4 py-3 font-mono text-right sm:text-left">
                  {formatPrice(row.averageBuyPrice, row.currency || 'INR')}
                </td>

                <td className="px-4 py-3 font-mono font-medium text-right sm:text-left">
                  {formatPrice(row.currentPrice, row.currency || 'INR')}
                </td>

                <td className="px-4 py-3 font-mono text-right sm:text-left text-[#6B6858]">
                  {formatRupee(row.invested)}
                </td>

                <td className="px-4 py-3 font-mono font-medium text-right sm:text-left text-[#122A22]">
                  {formatRupee(row.currentValue)}
                </td>

                <td
                  className={`px-4 py-3 font-medium font-mono text-right sm:text-left ${
                    up ? 'text-[#2F6B4F]' : 'text-[#9B3A32]'
                  }`}
                >
                  <div>{formatSignedRupee(row.profitLossAmount)}</div>
                  <div className="text-xs">({formatPercent(row.profitLossPercent)})</div>
                </td>

                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/stocks/${row.symbol}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-mono font-medium rounded bg-[#122A22] text-[#F7F5EF] hover:bg-[#0D1F19] transition-colors shadow-xs"
                    title={`Trade or view chart for ${row.symbol}`}
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
  );
}
