'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchStockDetail, fetchStockHistory, type StockDetail, type StockHistory } from '../lib/api/stocks';
import { useWhenMarketOpen } from './useWhenMarketOpen';

// Live prices: the quote is re-read this often while the tab is visible.
const QUOTE_REFRESH_MS = 10_000;
// The one-day chart is also refreshed, so the latest candle keeps moving.
const INTRADAY_CHART_REFRESH_MS = 30_000;

export function useStockDetail(symbol: string) {
  const [range, setRange] = useState('1m');
  const [stock, setStock] = useState<StockDetail | null>(null);
  const [guest, setGuest] = useState(true);
  const [forex, setForex] = useState<{ rate: number; source: string; updatedAt: string } | null>(null);
  const [history, setHistory] = useState<StockHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<number | null>(null);

  const loadQuote = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchStockDetail(symbol);
      setStock(data.stock);
      setGuest(Boolean(data.guest));
      setForex(data.forex || null);
      setStatus(200);
      setLastUpdated(new Date());
    } catch (err: any) {
      setStatus(err.status || 400);
      setError(err.message || 'Could not load stock');
      setStock(null);
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  // Background refresh: never shows a loading state and keeps the last good data on failure.
  const refreshQuote = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await fetchStockDetail(symbol);
      setStock(data.stock);
      setGuest(Boolean(data.guest));
      setForex(data.forex || null);
      setLastUpdated(new Date());
    } catch {
      // keep showing the last quote
    } finally {
      setRefreshing(false);
    }
  }, [symbol]);

  const loadHistory = useCallback(
    async (silent = false) => {
      if (!silent) {
        setHistoryLoading(true);
      }
      try {
        const data = await fetchStockHistory(symbol, range);
        setHistory(data.history);
      } catch {
        if (!silent) {
          setHistory(null);
        }
      } finally {
        if (!silent) {
          setHistoryLoading(false);
        }
      }
    },
    [symbol, range]
  );

  useEffect(() => {
    loadQuote();
  }, [loadQuote]);

  useEffect(() => {
    if (status === 200) {
      loadHistory();
    }
  }, [status, loadHistory]);

  const quoteMarket = stock?.market === 'US' ? 'US' : 'IN';

  useWhenMarketOpen(refreshQuote, {
    market: quoteMarket,
    intervalMs: QUOTE_REFRESH_MS,
    enabled: status === 200,
  });

  const silentHistory = useCallback(() => {
    loadHistory(true);
  }, [loadHistory]);

  useWhenMarketOpen(silentHistory, {
    market: quoteMarket,
    intervalMs: INTRADAY_CHART_REFRESH_MS,
    enabled: status === 200 && range === '1d',
  });

  return {
    stock,
    guest,
    forex,
    history,
    range,
    setRange,
    loading,
    refreshing,
    lastUpdated,
    historyLoading,
    error,
    status,
    reload: loadQuote,
  };
}
