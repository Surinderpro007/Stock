import { apiFetch } from './client';

export type HoldingRow = {
  symbol: string;
  companyName: string;
  logoUrl?: string | null;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  currency?: 'INR' | 'USD';
  exchangeRate?: number;
  invested: number;
  currentValue: number;
  profitLossAmount: number;
  profitLossPercent: number;
};

export type Portfolio = {
  balance: number;
  totalInvested: number;
  currentValue: number;
  forexRate?: number;
  profitLossAmount: number;
  profitLossPercent: number;
  holdings: HoldingRow[];
  pendingOrders?: OrderRow[];
};

export type TradeResult = {
  type?: 'buy' | 'sell';
  side?: 'buy' | 'sell';
  orderType?: 'market' | 'limit';
  status?: 'executed' | 'pending' | 'cancelled' | 'rejected';
  symbol: string;
  quantity: number;
  price?: number;
  currency?: 'INR' | 'USD';
  exchangeRate?: number;
  limitPrice?: number;
  total: number;
  totalInr?: number;
  balance: number;
  orderId?: string;
  transactionId?: string;
  message?: string;
};

export type OrderRow = {
  id: string;
  symbol: string;
  companyName: string;
  logoUrl?: string | null;
  side: 'buy' | 'sell';
  orderType: 'market' | 'limit';
  quantity: number;
  currency?: 'INR' | 'USD';
  limitPrice?: number;
  executionPrice?: number;
  currentPrice?: number;
  total: number;
  totalInr?: number;
  status: 'pending' | 'executed' | 'cancelled' | 'rejected';
  distance?: number;
  distancePercent?: number;
  placedAt: string;
  executedAt?: string;
  cancelledAt?: string;
  rejectionReason?: string;
};

export type TransactionRow = {
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

export async function fetchPortfolio() {
  return apiFetch<{ portfolio: Portfolio }>('/api/portfolio');
}

export async function placeTrade(
  type: 'buy' | 'sell',
  symbol: string,
  quantity: number,
  options: { orderType?: 'market' | 'limit'; limitPrice?: number } = {}
) {
  return apiFetch<{ message: string; trade: TradeResult }>(`/api/portfolio/${type}`, {
    method: 'POST',
    body: JSON.stringify({
      symbol,
      quantity,
      orderType: options.orderType || 'market',
      limitPrice: options.limitPrice,
    }),
  });
}

export async function fetchOrders(params: { status?: string; symbol?: string } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set('status', params.status);
  if (params.symbol) query.set('symbol', params.symbol);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<{ orders: OrderRow[] }>(`/api/portfolio/orders${suffix}`);
}

export async function cancelOrder(orderId: string) {
  return apiFetch<{ message: string; orderId: string }>(`/api/portfolio/orders/${orderId}`, {
    method: 'DELETE',
  });
}

export async function fetchTransactions(
  params: { page?: number; limit?: number; type?: 'buy' | 'sell' } = {}
) {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.type) query.set('type', params.type);
  const suffix = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<{
    transactions: TransactionRow[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }>(`/api/transactions${suffix}`);
}

