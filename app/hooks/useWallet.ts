'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchWallet, addWalletFunds, resetWalletBalance, type WalletData } from '../lib/api/wallet';

const WALLET_REFRESH_MS = 20_000;

export function useWallet() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<number | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    } else {
      setRefreshing(true);
    }

    try {
      const data = await fetchWallet();
      setWallet(data.wallet);
      setStatus(200);
      setLastUpdated(new Date());
    } catch (err: any) {
      if (!silent) {
        setStatus(err.status || 400);
        setError(err.message || 'Could not load wallet data');
        setWallet(null);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible' && status === 200) {
        load(true);
      }
    }, WALLET_REFRESH_MS);

    return () => clearInterval(timer);
  }, [load, status]);

  const deposit = async (amount: number) => {
    setActionLoading(true);
    try {
      const res = await addWalletFunds(amount);
      if (res.wallet) {
        setWallet(res.wallet);
        setLastUpdated(new Date());
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to deposit funds');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const reset = async () => {
    setActionLoading(true);
    try {
      const res = await resetWalletBalance();
      if (res.wallet) {
        setWallet(res.wallet);
        setLastUpdated(new Date());
        return true;
      }
      return false;
    } catch (err: any) {
      setError(err.message || 'Failed to reset balance');
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    wallet,
    loading,
    refreshing,
    actionLoading,
    lastUpdated,
    error,
    status,
    reload: () => load(false),
    deposit,
    reset,
  };
}
