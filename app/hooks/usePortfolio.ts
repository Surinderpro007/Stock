'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchPortfolio, type Portfolio } from '../lib/api/portfolio';
import { useWhenMarketOpen } from './useWhenMarketOpen';

const PORTFOLIO_REFRESH_MS = 15_000;

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    } else {
      setRefreshing(true);
    }
    try {
      const data = await fetchPortfolio();
      setPortfolio(data.portfolio);
      setStatus(200);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (!silent) {
        setStatus(err.status || 400);
        setError(err.message || 'Could not load portfolio');
        setPortfolio(null);
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
    intervalMs: PORTFOLIO_REFRESH_MS,
    enabled: status === 200,
  });

  return {
    portfolio,
    loading,
    refreshing,
    lastUpdated,
    error,
    status,
    reload: () => load(false),
  };
}
