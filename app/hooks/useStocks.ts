'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchStocks, type PublicStock } from '../lib/api/stocks';
import { useWhenMarketOpen } from './useWhenMarketOpen';

// Prices are re-read this often while the tab is visible and the selected market is open.
const LIST_REFRESH_MS = 10_000;

export function useStocks(initial?: {
  q?: string;
  category?: string;
  market?: 'IN' | 'US';
  sortBy?: string;
  order?: string;
}) {
  const [q, setQ] = useState(initial?.q || '');
  const [category, setCategory] = useState(initial?.category || 'all');
  const [market, setMarketState] = useState<'IN' | 'US'>(initial?.market || 'IN');
  const [sortBy, setSortBy] = useState(initial?.sortBy || 'symbol');
  const [order, setOrder] = useState(initial?.order || 'asc');
  const [stocks, setStocks] = useState<PublicStock[]>([]);
  const [guest, setGuest] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const setMarket = (nextMarket: 'IN' | 'US') => {
    setMarketState(nextMarket);
    setCategory('all');
  };

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError('');
      } else {
        setRefreshing(true);
      }
      try {
        const data = await fetchStocks({
          q,
          category: category !== 'all' ? category : undefined,
          market,
          sortBy,
          order,
        });
        setStocks(data.stocks);
        setGuest(data.guest);
        setLastUpdated(new Date());
      } catch (err: any) {
        // A failed background refresh keeps the last list instead of replacing it with an error.
        if (!silent) {
          setError(err.message || 'Could not load stocks');
        }
      } finally {
        if (!silent) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [q, category, market, sortBy, order]
  );

  useEffect(() => {
    load();
  }, [load]);

  const silentReload = useCallback(() => {
    load(true);
  }, [load]);

  useWhenMarketOpen(silentReload, { market, intervalMs: LIST_REFRESH_MS });

  function toggleSort(field: string) {
    if (sortBy === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(field);
    setOrder(field === 'symbol' || field === 'name' ? 'asc' : 'desc');
  }

  return {
    q,
    setQ,
    category,
    setCategory,
    market,
    setMarket,
    sortBy,
    order,
    toggleSort,
    stocks,
    guest,
    loading,
    refreshing,
    lastUpdated,
    error,
    reload: () => load(false),
  };
}
