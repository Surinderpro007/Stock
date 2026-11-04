import { apiFetch } from './client';

export type MarketNewsItem = {
  id: string;
  title: string;
  source: string;
  link: string;
  pubDate: string;
  timeAgo: string;
  category: string;
  snippet?: string;
  symbols: string[];
};

export type NewsResponse = {
  success: boolean;
  count: number;
  news: MarketNewsItem[];
  fetchedAt: string;
  cached?: boolean;
};

export async function fetchNews(params: {
  q?: string;
  category?: string;
  symbol?: string;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.symbol) query.set('symbol', params.symbol);
  if (params.limit) query.set('limit', String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<NewsResponse>(`/api/news${suffix}`);
}
