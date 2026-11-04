'use client';

import { useEffect, useState } from 'react';

/** Re-render on an interval so session labels flip at open/close without a reload. */
export function useMarketClock(intervalMs = 30_000) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
