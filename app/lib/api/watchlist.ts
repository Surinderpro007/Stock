import { apiFetch } from './client';

export type WatchlistStock = {
  symbol: string;
  companyName: string;
  sector: string;
  market?: 'IN' | 'US';
  exchange?: string;
  currency?: 'INR' | 'USD';
  logoUrl?: string | null;
  currentPrice: number;
  previousClose: number;
  changeAmount: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
  marketCap: number;
  volume: number;
};

export type WatchlistResponse = {
  watchlist: WatchlistStock[];
  symbols: string[];
};

export type WatchlistToggleResponse = {
  success: boolean;
  watched: boolean;
  symbol: string;
  symbols: string[];
};

export async function fetchWatchlist() {
  return apiFetch<WatchlistResponse>('/api/watchlist');
}

export async function toggleWatchlist(symbol: string) {
  return apiFetch<WatchlistToggleResponse>('/api/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol, action: 'toggle' }),
  });
}

export async function addToWatchlist(symbol: string) {
  return apiFetch<WatchlistToggleResponse>('/api/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol, action: 'add' }),
  });
}

export async function removeFromWatchlist(symbol: string) {
  return apiFetch<WatchlistToggleResponse>('/api/watchlist', {
    method: 'POST',
    body: JSON.stringify({ symbol, action: 'remove' }),
  });
}
