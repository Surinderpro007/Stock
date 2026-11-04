'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, formatRupee } from '../../lib/formatMoney';
import { cancelOrder, type OrderRow } from '../../lib/api/portfolio';
import StockLogo from '../stocks/StockLogo';

interface PendingOrdersTableProps {
  orders: OrderRow[];
  onCancelled?: () => void;
}

export default function PendingOrdersTable({ orders, onCancelled }: PendingOrdersTableProps) {
  const router = useRouter();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRowClick = (symbol: string) => {
    router.push(`/stocks/${symbol}`);
  };

  const handleCancel = async (e: React.MouseEvent, orderId: string, symbol: string) => {
    e.stopPropagation();
    if (cancellingId) return;

    setCancellingId(orderId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await cancelOrder(orderId);
      setSuccessMessage(`Pending order for ${symbol} cancelled successfully.`);
      if (onCancelled) {
        onCancelled();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to cancel order');
    } finally {
      setCancellingId(null);
    }
  };

  if (!orders.length) {
    return (
      <div className="border border-[#DDD8CC] rounded-md bg-white p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#F7F5EF] border border-[#DDD8CC] flex items-center justify-center mx-auto mb-3 text-lg font-mono text-[#B8935F]">
          ⏳
        </div>
        <h3 className="font-serif text-xl text-[#14140F] mb-2">No pending orders</h3>
        <p className="text-sm text-[#6B6858] max-w-md mx-auto mb-6">
          Orders placed while the market is closed are queued here and execute automatically
          when the market opens. Limit orders wait here until the live price reaches your target.
          Once executed, orders move to your holdings.
        </p>
        <Link
          href="/stocks"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-medium rounded bg-[#122A22] text-[#F7F5EF] hover:bg-[#0D1F19] transition-colors shadow-xs"
        >
          <span>Explore Stocks to Trade</span>
          <span className="text-[#B8935F]">→</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Notifications */}
      {successMessage && (
        <div className="p-3 text-xs font-mono bg-[#E8F3ED] text-[#2F6B4F] border border-[#2F6B4F]/30 rounded-md flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage('')}
            className="text-[#2F6B4F] hover:opacity-75 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 text-xs font-mono bg-[#FBEAE8] text-[#9B3A32] border border-[#9B3A32]/30 rounded-md flex items-center justify-between">
          <span>⚠ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage('')}
            className="text-[#9B3A32] hover:opacity-75 font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Desktop & Tablet Table (hidden on mobile, visible on sm+) */}
      <div className="hidden sm:block border border-[#DDD8CC] rounded-md bg-white overflow-hidden shadow-xs">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#DDD8CC] text-left text-xs font-mono tracking-wide uppercase text-[#6B6858] bg-[#FAF9F5]">
              <th className="px-4 py-3">Company & Symbol</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Qty</th>
              <th className="px-4 py-3 text-right">Target / Queue Price</th>
              <th className="px-4 py-3 text-right">Last Price</th>
              <th className="px-4 py-3 text-right">Status / Distance</th>
              <th className="px-4 py-3 text-right">Total Value</th>
              <th className="px-4 py-3 text-right w-24">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isBuy = order.side === 'buy';
              const isUsd = order.currency === 'USD';
              const isMarketQueued = order.orderType === 'market';
              const target = order.limitPrice ?? 0;
              const live = order.currentPrice ?? target;
              const diff = live - target;
              const diffPercent = target > 0 ? (diff / target) * 100 : 0;
              const isCancelling = cancellingId === order.id;
              const formattedQty = Number.isInteger(order.quantity)
                ? order.quantity
                : order.quantity.toFixed(4);
              const symbolPrefix = isUsd ? '$' : '₹';
              const exchangeName = isUsd ? 'NASDAQ' : 'NSE';

              return (
                <tr
                  key={order.id}
                  onClick={() => handleRowClick(order.symbol)}
                  className="border-b border-[#EFEDE4] last:border-0 hover:bg-[#FBF9F4] cursor-pointer transition-colors group"
                  title={`Click to view ${order.symbol} chart`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <StockLogo
                        name={order.companyName}
                        logoUrl={order.logoUrl}
                        symbol={order.symbol}
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-semibold text-[#122A22] group-hover:text-[#B8935F] transition-colors">
                            {order.symbol}
                          </span>
                          {isUsd && (
                            <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#EFEDE4] text-[#6B6858]">
                              US ($)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6B6858] font-medium truncate max-w-[150px]">
                          {order.companyName}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 font-mono text-xs px-2 py-0.5 rounded font-medium border ${
                        isBuy
                          ? 'bg-[#E8F3ED] text-[#2F6B4F] border-[#2F6B4F]/20'
                          : 'bg-[#FBEAE8] text-[#9B3A32] border-[#9B3A32]/20'
                      }`}
                    >
                      <span>{isBuy ? 'BUY' : 'SELL'}</span>
                      <span className="text-[10px] opacity-75">
                        {isMarketQueued ? 'MARKET' : 'LIMIT'}
                      </span>
                    </span>
                  </td>

                  <td className="px-4 py-3 font-mono font-medium text-right text-[#14140F]">
                    {formattedQty}
                  </td>

                  <td className="px-4 py-3 font-mono font-semibold text-right text-[#122A22]">
                    {isMarketQueued ? (
                      <span className="text-[#6B6858] font-normal text-[11px]">At open price</span>
                    ) : (
                      formatPrice(target, order.currency || 'INR')
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono text-right text-[#6B6858]">
                    {formatPrice(live, order.currency || 'INR')}
                  </td>

                  <td className="px-4 py-3 text-right">
                    {isMarketQueued ? (
                      <div>
                        <div className="font-mono text-xs font-medium text-[#B8935F]">
                          ⏸ {exchangeName} closed
                        </div>
                        <div className="text-[10px] font-mono text-[#6B6858]">
                          Executes at market open
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="font-mono text-xs font-medium text-[#122A22]">
                          {isBuy ? (
                            diff > 0 ? (
                              <span className="text-[#B8935F]">
                                {symbolPrefix}{diff.toFixed(2)} above target ({diffPercent.toFixed(1)}%)
                              </span>
                            ) : (
                              <span className="text-[#2F6B4F] font-semibold">At limit condition</span>
                            )
                          ) : diff < 0 ? (
                            <span className="text-[#B8935F]">
                              {symbolPrefix}{Math.abs(diff).toFixed(2)} below target ({Math.abs(diffPercent).toFixed(1)}%)
                            </span>
                          ) : (
                            <span className="text-[#2F6B4F] font-semibold">At limit condition</span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-[#6B6858]">
                          {isBuy ? 'Triggers at ≤ limit' : 'Triggers at ≥ limit'}
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 font-mono font-medium text-right text-[#14140F]">
                    <div>{formatPrice(order.total, order.currency || 'INR')}</div>
                    {isUsd && order.totalInr && (
                      <div className="text-[10px] text-[#6B6858] font-normal">
                        ({formatRupee(order.totalInr)})
                      </div>
                    )}
                  </td>

                  <td
                    className="px-4 py-3 text-right w-24"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={(e) => handleCancel(e, order.id, order.symbol)}
                      className="px-2.5 py-1 text-xs font-mono text-[#9B3A32] hover:text-white hover:bg-[#9B3A32] border border-[#9B3A32]/40 hover:border-[#9B3A32] rounded transition-colors disabled:opacity-50"
                      title="Cancel this pending limit order"
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (sm:hidden) */}
      <div className="sm:hidden space-y-3">
        {orders.map((order) => {
          const isBuy = order.side === 'buy';
          const isUsd = order.currency === 'USD';
          const isMarketQueued = order.orderType === 'market';
          const target = order.limitPrice ?? 0;
          const live = order.currentPrice ?? target;
          const diff = live - target;
          const isCancelling = cancellingId === order.id;
          const formattedQty = Number.isInteger(order.quantity)
            ? order.quantity
            : order.quantity.toFixed(4);
          const symbolPrefix = isUsd ? '$' : '₹';
          const exchangeName = isUsd ? 'NASDAQ' : 'NSE';

          return (
            <div
              key={order.id}
              onClick={() => handleRowClick(order.symbol)}
              className="border border-[#DDD8CC] rounded-md bg-white p-4 shadow-xs hover:bg-[#FBF9F4] cursor-pointer transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <StockLogo
                    name={order.companyName}
                    logoUrl={order.logoUrl}
                    symbol={order.symbol}
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-semibold text-sm text-[#122A22]">
                        {order.symbol}
                      </span>
                      {isUsd && (
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#EFEDE4] text-[#6B6858]">
                          US ($)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B6858] font-medium">{order.companyName}</p>
                  </div>
                </div>
                <span
                  className={`font-mono text-xs px-2 py-0.5 rounded font-medium border ${
                    isBuy
                      ? 'bg-[#E8F3ED] text-[#2F6B4F] border-[#2F6B4F]/20'
                      : 'bg-[#FBEAE8] text-[#9B3A32] border-[#9B3A32]/20'
                  }`}
                >
                  {isBuy ? 'BUY' : 'SELL'} {isMarketQueued ? 'MARKET' : 'LIMIT'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-[#FAF9F5] p-2.5 rounded border border-[#EFEDE4] mb-3">
                <div>
                  <span className="text-[#6B6858] block text-[10px] uppercase">Qty</span>
                  <span className="font-semibold text-[#14140F]">{formattedQty}</span>
                </div>
                <div>
                  <span className="text-[#6B6858] block text-[10px] uppercase">
                    {isMarketQueued ? 'Queued At' : 'Target Price'}
                  </span>
                  <span className="font-semibold text-[#122A22]">
                    {isMarketQueued
                      ? formatPrice(live, order.currency || 'INR')
                      : formatPrice(target, order.currency || 'INR')}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B6858] block text-[10px] uppercase">
                    {isMarketQueued ? 'Status' : 'Live Price'}
                  </span>
                  <span className="text-[#14140F]">
                    {isMarketQueued ? (
                      <span className="text-[#B8935F]">⏸ {exchangeName} closed</span>
                    ) : (
                      formatPrice(live, order.currency || 'INR')
                    )}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B6858] block text-[10px] uppercase">Total Value</span>
                  <span className="font-semibold text-[#14140F]">
                    {formatPrice(order.total, order.currency || 'INR')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  {isMarketQueued ? (
                    <span className="text-[#6B6858]">Executes at market open</span>
                  ) : isBuy ? (
                    diff > 0 ? (
                      <span className="text-[#B8935F]">
                        {symbolPrefix}{diff.toFixed(2)} above target
                      </span>
                    ) : (
                      <span className="text-[#2F6B4F] font-semibold">At limit condition</span>
                    )
                  ) : diff < 0 ? (
                    <span className="text-[#B8935F]">
                      {symbolPrefix}{Math.abs(diff).toFixed(2)} below target
                    </span>
                  ) : (
                    <span className="text-[#2F6B4F] font-semibold">At limit condition</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isCancelling}
                  onClick={(e) => handleCancel(e, order.id, order.symbol)}
                  className="px-2.5 py-1 text-xs font-mono text-[#9B3A32] hover:text-white hover:bg-[#9B3A32] border border-[#9B3A32]/40 rounded transition-colors disabled:opacity-50"
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
