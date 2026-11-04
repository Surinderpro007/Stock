'use client';

import { useEffect } from 'react';
import { isAnyMarketOpen, isMarketOpen } from '../../lib/marketStatus';

type MarketScope = 'IN' | 'US' | 'any';

export function useWhenMarketOpen(
  callback: () => void,
  {
    market = 'any',
    intervalMs,
    enabled = true,
  }: {
    market?: MarketScope;
    intervalMs: number;
    enabled?: boolean;
  }
) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let pollId: ReturnType<typeof setInterval> | undefined;

    function sessionOpen() {
      return market === 'any' ? isAnyMarketOpen() : isMarketOpen(market);
    }

    function startPoll() {
      if (pollId) {
        return;
      }
      pollId = setInterval(() => {
        if (document.visibilityState === 'visible' && sessionOpen()) {
          callback();
        }
      }, intervalMs);
    }

    function stopPoll() {
      if (pollId) {
        clearInterval(pollId);
        pollId = undefined;
      }
    }

    function sync() {
      if (sessionOpen()) {
        startPoll();
      } else {
        stopPoll();
      }
    }

    sync();
    const watchId = setInterval(sync, 30_000);

    return () => {
      clearInterval(watchId);
      stopPoll();
    };
  }, [callback, enabled, intervalMs, market]);
}