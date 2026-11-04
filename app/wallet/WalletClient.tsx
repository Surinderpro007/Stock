'use client';

import { useState } from 'react';
import Link from 'next/link';
import LoginRequired from '../components/auth/LoginRequired';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import ContextualMarketNews from '../components/news/ContextualMarketNews';
import { useWallet } from '../hooks/useWallet';
import { formatPrice, formatRupee, formatSignedRupee } from '../lib/formatMoney';

export default function WalletClient() {
  const {
    wallet,
    loading,
    refreshing,
    actionLoading,
    lastUpdated,
    error,
    status,
    reload,
    deposit,
    reset,
  } = useWallet();

  const [notification, setNotification] = useState<string | null>(null);

  if (status === 401) {
    return <LoginRequired open />;
  }

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleDeposit = async (amount: number) => {
    const ok = await deposit(amount);
    if (ok) {
      showToast(`Successfully added ${formatRupee(amount)} virtual cash to your wallet.`);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset your virtual cash balance to the initial starting capital (₹10,000)?')) {
      const ok = await reset();
      if (ok) {
        showToast('Wallet balance has been reset to starting capital (₹10,000.00).');
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      {/* Top status bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase">
          Cash & Liquidity
        </p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono font-medium text-[#122A22]">
              Live Cash Account
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
            title="Refresh wallet balance"
          >
            <span className={loading || refreshing ? 'animate-spin inline-block' : ''}>↻</span>
            <span>{refreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-serif text-3xl text-[#14140F]">Trading Wallet</h1>
          <p className="text-sm text-[#6B6858] mt-1">
            Dedicated cash reserves available for immediate stock purchases and order settlements
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/stocks"
            className="px-4 py-2 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md hover:bg-[#0D1F19] transition-colors"
          >
            Deploy Cash in Stocks →
          </Link>
          <Link
            href="/portfolio"
            className="px-4 py-2 text-xs font-mono border border-[#DDD8CC] text-[#122A22] rounded-md hover:bg-[#EFEDE4] transition-colors"
          >
            View Portfolio
          </Link>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="mb-6 p-4 rounded-md bg-[#122A22] text-[#F7F5EF] text-sm flex items-center justify-between border border-[#B8935F]">
          <span>✓ {notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-xs text-[#B8935F] hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {loading && !wallet && <LoadingState label="Loading wallet..." />}
      {!loading && error && !wallet && <ErrorState message={error} />}

      {wallet && (
        <>
          {/* Main Balance Hero Card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2 border border-[#DDD8CC] rounded-md bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs tracking-wider text-[#B8935F] uppercase">
                    Available Trading Cash
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Ready to Trade
                  </span>
                </div>
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="font-serif text-4xl sm:text-5xl font-medium text-[#14140F]">
                    {formatRupee(wallet.balance)}
                  </span>
                  <span className="text-sm font-mono text-[#6B6858]">{wallet.currency}</span>
                </div>
                <p className="text-xs text-[#6B6858]">
                  Starting allotment: {formatRupee(wallet.startingBalance)} • Real-time instant settlement
                </p>
              </div>

              {/* Fund Management Quick Actions */}
              <div className="pt-6 mt-6 border-t border-[#EFEDE4]">
                <p className="text-xs font-mono uppercase tracking-wider text-[#6B6858] mb-3">
                  Add Virtual Paper Capital:
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleDeposit(10000)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-mono border border-[#DDD8CC] rounded hover:border-[#122A22] hover:bg-[#F7F5EF] transition-colors disabled:opacity-50"
                  >
                    + ₹10,000
                  </button>
                  <button
                    onClick={() => handleDeposit(25000)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-mono border border-[#DDD8CC] rounded hover:border-[#122A22] hover:bg-[#F7F5EF] transition-colors disabled:opacity-50"
                  >
                    + ₹25,000
                  </button>
                  <button
                    onClick={() => handleDeposit(50000)}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-mono border border-[#DDD8CC] rounded hover:border-[#122A22] hover:bg-[#F7F5EF] transition-colors disabled:opacity-50"
                  >
                    + ₹50,000
                  </button>
                  <button
                    onClick={handleReset}
                    disabled={actionLoading}
                    className="px-3 py-1.5 text-xs font-mono text-[#9B3A32] border border-[#DDD8CC] rounded hover:bg-rose-50 transition-colors ml-auto disabled:opacity-50"
                  >
                    Reset Balance
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="border border-[#DDD8CC] rounded-md bg-white p-6 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="font-mono text-xs tracking-wider text-[#B8935F] uppercase mb-4">
                  Account Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#6B6858]">Cash Deployed in Holdings</p>
                    <p className="text-lg font-serif font-medium text-[#14140F]">
                      {formatRupee(wallet.totalCommitted)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6858]">Proceeds from Stock Sales</p>
                    <p className="text-lg font-serif font-medium text-[#2F6B4F]">
                      +{formatRupee(wallet.cashInflow)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6858]">Spent on Stock Buys</p>
                    <p className="text-lg font-serif font-medium text-[#9B3A32]">
                      -{formatRupee(wallet.cashOutflow)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6B6858]">Total Orders Executed</p>
                    <p className="text-lg font-serif font-medium text-[#14140F]">
                      {wallet.totalTrades}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-[#EFEDE4]">
                <Link
                  href="/transactions"
                  className="text-xs font-mono text-[#122A22] hover:underline flex items-center justify-between"
                >
                  <span>Full Transaction History</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Cash Ledger / Recent Activity */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-xl text-[#14140F]">Recent Cash Activity</h2>
              <Link href="/transactions" className="text-xs font-mono text-[#122A22] hover:underline">
                View all orders →
              </Link>
            </div>

            {wallet.recentTransactions.length === 0 ? (
              <div className="border border-[#DDD8CC] rounded-md bg-white p-8 text-center">
                <p className="text-sm text-[#6B6858] mb-3">
                  No cash movements recorded yet. Buy your first stock to see debit entries.
                </p>
                <Link
                  href="/stocks"
                  className="px-4 py-2 text-xs font-mono bg-[#122A22] text-[#F7F5EF] rounded-md hover:bg-[#0D1F19] transition-colors inline-block"
                >
                  Browse Listed Stocks
                </Link>
              </div>
            ) : (
              <div className="border border-[#DDD8CC] rounded-md bg-white overflow-x-auto shadow-xs">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#DDD8CC] text-left text-xs font-mono tracking-wide uppercase text-[#6B6858]">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Type</th>
                      <th className="px-4 py-3">Symbol</th>
                      <th className="px-4 py-3">Quantity</th>
                      <th className="px-4 py-3">Executed Price</th>
                      <th className="px-4 py-3 text-right">Cash Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wallet.recentTransactions.map((tx) => {
                      const isBuy = tx.type === 'buy';
                      return (
                        <tr key={tx.id} className="border-b border-[#EFEDE4] last:border-0 hover:bg-[#FBF9F4]">
                          <td className="px-4 py-3 font-mono text-xs text-[#6B6858]">
                            {new Date(tx.date).toLocaleDateString('en-IN', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-mono uppercase font-semibold ${
                                isBuy
                                  ? 'bg-rose-50 text-[#9B3A32] border border-rose-200'
                                  : 'bg-emerald-50 text-[#2F6B4F] border border-emerald-200'
                              }`}
                            >
                              {isBuy ? 'Debit (Buy)' : 'Credit (Sell)'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/stocks/${tx.symbol}`}
                              className="font-mono font-medium text-[#122A22] hover:text-[#B8935F]"
                            >
                              {tx.symbol}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {Number.isInteger(tx.quantity) ? tx.quantity : tx.quantity.toFixed(4)}
                          </td>
                          <td className="px-4 py-3 font-mono">
                            {formatPrice(tx.price, tx.currency || 'INR')}
                          </td>
                          <td
                            className={`px-4 py-3 font-mono font-medium text-right ${
                              isBuy ? 'text-[#9B3A32]' : 'text-[#2F6B4F]'
                            }`}
                          >
                            <div>{isBuy ? `-${formatRupee(tx.totalInr || tx.total)}` : `+${formatRupee(tx.totalInr || tx.total)}`}</div>
                            {tx.currency === 'USD' && (
                              <div className="text-[10px] text-[#6B6858] font-normal">
                                ({formatPrice(tx.total, 'USD')})
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Contextual Market News */}
          <ContextualMarketNews
            title="Macro & Liquidity News Wire"
            subtitle="Central bank updates, monetary policy, and currency trends impacting market liquidity"
            category="economy"
            limit={4}
          />
        </>
      )}
    </div>
  );
}
