'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWhenMarketOpen } from './useWhenMarketOpen';
import {
  fetchWatchlist,
  toggleWatchlist,
  type WatchlistStock,
} from '../lib/api/watchlist';

const WATCHLIST_REFRESH_MS = 15_000;

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    } else {
      setRefreshing(true);
    }

    try {
      const data = await fetchWatchlist();
      setWatchlist(data.watchlist || []);
      setSymbols(data.symbols || []);
      setStatus(200);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (!silent) {
        setStatus(err.status || 400);
        setError(err.message || 'Could not load watchlist');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const silentReload = useCallback(() => {
    load(true);
  }, [load]);

  useWhenMarketOpen(silentReload, {
    market: 'any',
    intervalMs: WATCHLIST_REFRESH_MS,
    enabled: status === 200,
  });

  const isWatchlisted = useCallback(
    (symbol: string) => {
      return symbols.includes(symbol.toUpperCase());
    },
    [symbols]
  );

  const toggle = async (symbol: string) => {
    const upper = symbol.toUpperCase();
    const currentlyWatched = symbols.includes(upper);

    // Optimistic state update
    if (currentlyWatched) {
      setSymbols((prev) => prev.filter((s) => s !== upper));
      setWatchlist((prev) => prev.filter((s) => s.symbol !== upper));
    } else {
      setSymbols((prev) => [...prev, upper]);
    }

    try {
      const res = await toggleWatchlist(upper);
      if (res.symbols) {
        setSymbols(res.symbols);
      }
      return res.watched;
    } catch (err: any) {
      // Revert on failure
      load(true);
      throw err;
    }
  };

  return {
    watchlist,
    symbols,
    isWatchlisted,
    toggle,
    loading,
    refreshing,
    error,
    status,
    lastUpdated,
    reload: () => load(false),
  };
}
