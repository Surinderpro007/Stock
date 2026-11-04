import { apiFetch } from './client';

export type WalletTransaction = {
  id: string;
  date: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  currency?: 'INR' | 'USD';
  total: number;
  totalInr?: number;
  exchangeRate?: number;
};

export type WalletData = {
  balance: number;
  startingBalance: number;
  currency: string;
  totalTrades: number;
  cashInflow: number;
  cashOutflow: number;
  totalCommitted: number;
  recentTransactions: WalletTransaction[];
};

export async function fetchWallet() {
  return apiFetch<{ wallet: WalletData }>('/api/wallet');
}

export async function addWalletFunds(amount: number) {
  return apiFetch<{ success: boolean; wallet: WalletData }>('/api/wallet', {
    method: 'POST',
    body: JSON.stringify({ action: 'add', amount }),
  });
}

export async function resetWalletBalance() {
  return apiFetch<{ success: boolean; wallet: WalletData }>('/api/wallet', {
    method: 'POST',
    body: JSON.stringify({ action: 'reset' }),
  });
}
