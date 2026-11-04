'use client';

import { useEffect, useState } from 'react';

type Overview = {
  totalTrades: number;
  totalVolume: number;
  walletCount: number;
  buys: { count: number; volume: number };
  sells: { count: number; volume: number };
  recent: {
    id: string;
    date: string;
    symbol: string;
    type: string;
    quantity: number;
    price: number;
    total: number;
  }[];
};

function rupee(value: number) {
  return `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function AdminTrades() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetch('/api/admin/trades', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setOverview(data.overview);
        setError('');
      } else {
        setError(data.error || 'Could not load trades');
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <p className="text-center text-[#6B6858] py-10">Loading...</p>;
  }

  if (error || !overview) {
    return <p className="text-center text-[#6B6858] py-10">{error || 'No trade data'}</p>;
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-[#DDD8CC] rounded-lg px-4 py-3">
          <p className="text-xs font-mono uppercase tracking-wide text-[#6B6858] mb-1">Total trades</p>
          <p className="text-lg text-[#14140F]">{overview.totalTrades}</p>
        </div>
        <div className="bg-white border border-[#DDD8CC] rounded-lg px-4 py-3">
          <p className="text-xs font-mono uppercase tracking-wide text-[#6B6858] mb-1">Volume</p>
          <p className="text-lg text-[#14140F]">{rupee(overview.totalVolume)}</p>
        </div>
        <div className="bg-white border border-[#DDD8CC] rounded-lg px-4 py-3">
          <p className="text-xs font-mono uppercase tracking-wide text-[#6B6858] mb-1">Buys</p>
          <p className="text-lg text-[#14140F]">{overview.buys.count}</p>
        </div>
        <div className="bg-white border border-[#DDD8CC] rounded-lg px-4 py-3">
          <p className="text-xs font-mono uppercase tracking-wide text-[#6B6858] mb-1">Wallets</p>
          <p className="text-lg text-[#14140F]">{overview.walletCount}</p>
        </div>
      </div>

      <div className="bg-white border border-[#DDD8CC] rounded-lg overflow-hidden">
        {overview.recent.length === 0 ? (
          <p className="text-center text-[#6B6858] py-10">No trades yet</p>
        ) : (
          <div className="divide-y divide-[#EFEDE4]">
            {overview.recent.map((trade) => (
              <div key={trade.id} className="px-4 py-3 text-sm flex flex-wrap justify-between gap-2">
                <span className="font-mono text-[#122A22]">{trade.symbol}</span>
                <span className="capitalize text-[#14140F]">{trade.type}</span>
                <span className="text-[#6B6858]">
                  {trade.quantity} × {rupee(trade.price)}
                </span>
                <span className="text-[#14140F]">{rupee(trade.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
