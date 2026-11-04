'use client';

import { useEffect, useState } from 'react';
import LoginRequired from '../components/auth/LoginRequired';
import EmptyState from '../components/ui/EmptyState';
import ErrorState from '../components/ui/ErrorState';
import LoadingState from '../components/ui/LoadingState';
import { fetchTransactions, type TransactionRow } from '../lib/api/portfolio';
import { formatPrice, formatRupee } from '../lib/formatMoney';

export default function TransactionsClient() {
  const [rows, setRows] = useState<TransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchTransactions({ page });
        if (cancelled) return;
        setRows(data.transactions);
        setTotalPages(data.totalPages);
        setStatus(200);
      } catch (err: any) {
        if (cancelled) return;
        setStatus(err.status || 400);
        setError(err.message || 'Could not load transactions');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page]);

  if (status === 401) {
    return <LoginRequired open />;
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] mb-3 uppercase">Activity</p>
      <h1 className="font-serif text-3xl text-[#14140F] mb-8">Transaction history</h1>

      {loading && <LoadingState label="Loading transactions" />}
      {!loading && error && <ErrorState message={error} />}
      {!loading && !error && rows.length === 0 && (
        <EmptyState message="No buys or sells yet." />
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="border border-[#DDD8CC] rounded-md bg-white overflow-x-auto shadow-xs">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#DDD8CC] text-left text-xs font-mono tracking-wide uppercase text-[#6B6858]">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Symbol</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isUsd = row.currency === 'USD';
                const formattedQty = Number.isInteger(row.quantity)
                  ? row.quantity
                  : row.quantity.toFixed(4);

                return (
                  <tr key={row.id} className="border-b border-[#EFEDE4] last:border-0 hover:bg-[#FBF9F4] transition-colors">
                    <td className="px-4 py-3 text-[#6B6858] font-mono text-xs">
                      {new Date(row.date).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#122A22]">
                      <div className="flex items-center gap-1.5">
                        <span>{row.symbol}</span>
                        {isUsd && (
                          <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-[#EFEDE4] text-[#6B6858] font-normal">
                            US ($)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-xs px-2 py-0.5 rounded font-medium ${
                          row.type === 'buy'
                            ? 'bg-[#E8F3ED] text-[#2F6B4F]'
                            : 'bg-[#FBEAE8] text-[#9B3A32]'
                        }`}
                      >
                        {row.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-right font-medium text-[#14140F]">
                      {formattedQty}
                    </td>
                    <td className="px-4 py-3 font-mono text-right">
                      {formatPrice(row.price, row.currency || 'INR')}
                    </td>
                    <td className="px-4 py-3 font-mono text-right font-semibold text-[#122A22]">
                      <div>{formatPrice(row.total, row.currency || 'INR')}</div>
                      {isUsd && row.totalInr && (
                        <div className="text-[11px] font-normal text-[#6B6858]">
                          ({formatRupee(row.totalInr)})
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

      {totalPages > 1 && (
        <div className="flex justify-end gap-2 mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((value) => value - 1)}
            className="px-3 py-1.5 text-sm font-mono border border-[#DDD8CC] rounded-md disabled:opacity-50 hover:bg-[#EFEDE4]"
          >
            Previous
          </button>
          <span className="px-3 py-1.5 text-sm font-mono text-[#6B6858]">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((value) => value + 1)}
            className="px-3 py-1.5 text-sm font-mono border border-[#DDD8CC] rounded-md disabled:opacity-50 hover:bg-[#EFEDE4]"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
