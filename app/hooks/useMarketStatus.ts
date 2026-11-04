'use client';

import { useMarketClock } from './useMarketClock';
import { getMarketStatus } from '../../lib/marketStatus';

/** Live open/closed status for a market ('IN' | 'US'), refreshed on a timer. */
export function useMarketStatus(market: 'IN' | 'US' | string = 'IN') {
  const nowMs = useMarketClock();
  return getMarketStatus(market, new Date(nowMs));
}