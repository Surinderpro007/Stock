import { apiFetch } from './client';

export type PublicStock = {
  symbol: string;
  companyName: string;
  sector?: string;
  market?: 'IN' | 'US';
  exchange?: string;
  currency?: 'INR' | 'USD';
  currentPrice: number;
  logoUrl?: string | null;
  previousClose?: number;
  changeAmount?: number;
  changePercent?: number;
  volume?: number;
  priceTime?: string;
  quoteUpdatedAt?: string;
};

export type StockDetail = {
  symbol: string;
  companyName: string;
  sector: string;
  market?: 'IN' | 'US';
  exchange?: string;
  currency?: 'INR' | 'USD';
  description: string;
  logoUrl?: string | null;
  currentPrice: number;
  previousClose: number;
  openPrice?: number;
  dayHigh: number;
  dayLow: number;
  marketCap: number;
  week52High: number;
  week52Low: number;
  volume?: number;
  changeAmount: number;
  changePercent: number;
  /** When the exchange last traded this price (ISO). */
  priceTime?: string;
  /** When we last refreshed the quote from the market feed (ISO). */
  quoteUpdatedAt?: string;
};

export type HistoryPoint = {
  timestamp: string;
  /** Close price. Always present. */
  price: number;
  /** Candle values. Missing for the offline simulated provider. */
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
};

export type StockHistory = {
  symbol: string;
  range: string;
  interval: string;
  /** true when candles are intraday (minutes); false for daily/weekly candles. */
  isIntraday?: boolean;
  source?: string;
  startPrice: number;
  endPrice: number;
  isUp: boolean;
  points: HistoryPoint[];
};

export async function fetchStocks(params: {
  q?: string;
  category?: string;
  market?: string;
  sortBy?: string;
  order?: string;
  limit?: number;
} = {}) {
  const query = new URLSearchParams();
  if (params.q) query.set('q', params.q);
  if (params.category) query.set('category', params.category);
  if (params.market) query.set('market', params.market);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.order) query.set('order', params.order);
  if (params.limit) query.set('limit', String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<{ stocks: PublicStock[]; guest: boolean }>(`/api/stocks${suffix}`);
}

export async function fetchStockDetail(symbol: string) {
  return apiFetch<{
    stock: StockDetail;
    guest?: boolean;
    forex?: { rate: number; source: string; updatedAt: string } | null;
  }>(`/api/stocks/${encodeURIComponent(symbol)}`);
}

export async function fetchStockHistory(symbol: string, range: string) {
  return apiFetch<{ history: StockHistory }>(
    `/api/stocks/${encodeURIComponent(symbol)}/history?range=${encodeURIComponent(range)}`
  );
}
