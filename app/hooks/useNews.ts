'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchNews, type MarketNewsItem } from '../lib/api/news';

const NEWS_REFRESH_MS = 45_000;

export function useNews(initialCategory = 'all', initialSymbol = '', limit = 25) {
  const [news, setNews] = useState<MarketNewsItem[]>([]);
  const [category, setCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(
    async (silent = false) => {
      if (!silent) {
        setLoading(true);
        setError('');
      } else {
        setRefreshing(true);
      }

      try {
        const data = await fetchNews({
          category: category !== 'all' ? category : undefined,
          q: searchQuery || undefined,
          symbol: initialSymbol || undefined,
          limit,
        });

        if (data.news) {
          setNews(data.news);
          setLastUpdated(new Date());
        }
      } catch (err: any) {
        if (!silent) {
          setError(err.message || 'Failed to fetch market news');
        }
      } finally {
        if (!silent) {
          setLoading(false);
        } else {
          setRefreshing(false);
        }
      }
    },
    [category, searchQuery, initialSymbol, limit]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        load(true);
      }
    }, NEWS_REFRESH_MS);

    return () => clearInterval(timer);
  }, [load]);

  return {
    news,
    category,
    setCategory,
    searchQuery,
    setSearchQuery,
    loading,
    refreshing,
    lastUpdated,
    error,
    reload: () => load(false),
  };
}
