'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import { placeTrade } from '../../lib/api/portfolio';
import { formatPrice } from '../../lib/formatMoney';
import { isMarketOpen } from '../../../lib/marketStatus';
import { useWhenMarketOpen } from '../../hooks/useWhenMarketOpen';
import { useMarketClock } from '../../hooks/useMarketClock';

type InputMode = 'inr' | 'usd' | 'shares';

interface TradeFormProps {
  symbol: string;
  currentPrice: number;
  currency?: string;
  exchange?: string;
  market?: 'IN' | 'US';
  initialForex?: { rate: number; source?: string; updatedAt?: string } | null;
  onComplete?: () => void;
  guest?: boolean;
  onGuestClick?: () => void;
}

export default function TradeForm({
  symbol,
  currentPrice,
  currency = 'INR',
  exchange,
  market,
  initialForex,
  onComplete,
  guest = false,
  onGuestClick,
}: TradeFormProps) {
  const isUsd = currency === 'USD';
  const marketId = market || (isUsd ? 'US' : 'IN');
  const exchangeLabel = exchange || (isUsd ? 'NASDAQ' : 'NSE');
  const nowMs = useMarketClock();
  const sessionOpen = isMarketOpen(marketId, new Date(nowMs));
  const priceTag = sessionOpen ? 'Live' : 'Last';

  // Forex rate state (dynamic from API)
  const [forexRate, setForexRate] = useState<number>(initialForex?.rate || 88.65);
  const [forexSource, setForexSource] = useState<string>(initialForex?.source || 'Yahoo Finance');
  const [forexLoading, setForexLoading] = useState(false);

  // Input mode: for US stocks, choose between INR amount, USD amount, or fractional shares
  const [inputMode, setInputMode] = useState<InputMode>(isUsd ? 'inr' : 'shares');
  const [amountInr, setAmountInr] = useState('5000');
  const [amountUsd, setAmountUsd] = useState('100');
  const [quantity, setQuantity] = useState('1');

  // Limit order state
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState(String(currentPrice));

  // Loading & notification state
  const [loading, setLoading] = useState<'buy' | 'sell' | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch real-time dynamic USD/INR forex rate if trading US stocks
  useEffect(() => {
    if (!isUsd) return;

    let isMounted = true;
    async function loadForexRate() {
      try {
        setForexLoading(true);
        const res = await fetch('/api/forex/usd-inr', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && typeof data.rate === 'number' && data.rate > 0) {
          setForexRate(data.rate);
          if (data.source) setForexSource(data.source);
        }
      } catch {
        // keep fallback or initial rate
      } finally {
        if (isMounted) setForexLoading(false);
      }
    }

    loadForexRate();
    return () => {
      isMounted = false;
    };
  }, [isUsd]);

  const refreshForex = useCallback(async () => {
    if (!isUsd) return;
    try {
      const res = await fetch('/api/forex/usd-inr', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (typeof data.rate === 'number' && data.rate > 0) {
        setForexRate(data.rate);
        if (data.source) setForexSource(data.source);
      }
    } catch {
      // keep last rate
    }
  }, [isUsd]);

  useWhenMarketOpen(refreshForex, { market: 'US', intervalMs: 60_000, enabled: isUsd });

  // Update limit price default when currentPrice changes if user hasn't typed
  useEffect(() => {
    if (!limitPrice || limitPrice === '0') {
      setLimitPrice(String(currentPrice));
    }
  }, [currentPrice, limitPrice]);

  const numLimitPrice = Number(limitPrice) || currentPrice;
  const evaluationPrice = orderType === 'limit' ? numLimitPrice : currentPrice;

  // Calculate executed quantity & INR wallet deduction based on mode
  const { calculatedShares, estimatedUsd, estimatedInr } = useMemo(() => {
    if (!isUsd) {
      const q = Math.max(0, parseInt(quantity, 10) || 0);
      const inr = q * evaluationPrice;
      return {
        calculatedShares: q,
        estimatedUsd: 0,
        estimatedInr: Math.round(inr * 100) / 100,
      };
    }

    // US Stocks logic:
    if (inputMode === 'inr') {
      const inr = Math.max(0, parseFloat(amountInr) || 0);
      const usd = forexRate > 0 ? inr / forexRate : 0;
      const shares = evaluationPrice > 0 ? usd / evaluationPrice : 0;
      const roundedShares = Number(shares.toFixed(4));
      return {
        calculatedShares: roundedShares,
        estimatedUsd: Math.round(usd * 100) / 100,
        estimatedInr: Math.round(inr * 100) / 100,
      };
    }

    if (inputMode === 'usd') {
      const usd = Math.max(0, parseFloat(amountUsd) || 0);
      const inr = usd * forexRate;
      const shares = evaluationPrice > 0 ? usd / evaluationPrice : 0;
      const roundedShares = Number(shares.toFixed(4));
      return {
        calculatedShares: roundedShares,
        estimatedUsd: Math.round(usd * 100) / 100,
        estimatedInr: Math.round(inr * 100) / 100,
      };
    }

    // mode === 'shares'
    const q = Math.max(0, parseFloat(quantity) || 0);
    const roundedShares = Number(q.toFixed(4));
    const usd = roundedShares * evaluationPrice;
    const inr = usd * forexRate;
    return {
      calculatedShares: roundedShares,
      estimatedUsd: Math.round(usd * 100) / 100,
      estimatedInr: Math.round(inr * 100) / 100,
    };
  }, [isUsd, inputMode, amountInr, amountUsd, quantity, evaluationPrice, forexRate]);

  async function submit(type: 'buy' | 'sell') {
    if (guest && onGuestClick) {
      onGuestClick();
      return;
    }

    setError('');
    setMessage('');

    if (calculatedShares <= 0) {
      setError('Please enter a valid investment amount or share quantity greater than 0');
      return;
    }

    if (orderType === 'limit') {
      if (!numLimitPrice || numLimitPrice <= 0) {
        setError(`Please enter a valid limit price greater than ${isUsd ? '$0' : '₹0'}`);
        return;
      }
    }

    setLoading(type);

    try {
      const result = await placeTrade(type, symbol, calculatedShares, {
        orderType,
        limitPrice: orderType === 'limit' ? numLimitPrice : undefined,
      });

      if (result.trade.status === 'pending') {
        setMessage(
          result.message ||
            `Limit ${type.toUpperCase()} order placed at ${formatPrice(
              numLimitPrice,
              currency
            )}. Track active orders under Portfolio → Pending.`
        );
      } else {
        const shareText =
          calculatedShares === 1 ? '1 share' : `${calculatedShares} shares`;
        setMessage(
          result.message ||
            `${type === 'buy' ? 'Bought' : 'Sold'} ${shareText} of ${symbol} at ${formatPrice(
              result.trade.price || currentPrice,
              currency
            )}.`
        );
      }

      onComplete?.();
    } catch (err: any) {
      if (err.status === 401 && onGuestClick) {
        onGuestClick();
        return;
      }
      setError(err.message || 'Order failed');
    } finally {
      setLoading(null);
    }
  }

  const addQuickLimitPrice = (delta: number) => {
    const cur = Number(limitPrice) || currentPrice;
    const step = isUsd ? 1 : 1;
    const minVal = isUsd ? 0.01 : 0.05;
    const next = Math.max(minVal, Math.round((cur + delta * step) * 100) / 100);
    setLimitPrice(String(next));
  };

  const setPercentLimitPrice = (percentDelta: number) => {
    const minVal = isUsd ? 0.01 : 0.05;
    const next = Math.max(minVal, Math.round(currentPrice * (1 + percentDelta / 100) * 100) / 100);
    setLimitPrice(String(next));
  };

  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Top Header Badge */}
        <div className="flex items-center justify-between mb-3">
          <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase">Order Pad</p>
          <span className="text-[11px] font-mono text-[#6B6858] bg-[#F7F5EF] px-2 py-0.5 rounded border border-[#DDD8CC]">
            {exchangeLabel} {orderType === 'market' ? 'Market Order' : 'Limit Order'}
          </span>
        </div>

        {/* Live Forex Rate Pill (US Stocks Only) */}
        {isUsd && (
          <div className="mb-4 p-2.5 rounded bg-[#F4F8F6] border border-[#C5DDD2] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#2F6B4F]"></span>
              <span className="text-[#122A22] font-semibold">
                $1 USD = ₹{forexRate.toFixed(2)}
              </span>
              <span className="text-[#6B6858] text-[10px]">
                {forexLoading ? '(Updating...)' : sessionOpen ? '• USD/INR rate' : '• Latest USD/INR rate'}
              </span>
            </div>
            <span className="text-[10px] text-[#6B6858] uppercase hidden sm:inline">
              Auto INR Conversion
            </span>
          </div>
        )}

        {/* Order Type Switcher Tabs (Market vs Limit) */}
        <div className="flex p-0.5 bg-[#F7F5EF] rounded border border-[#DDD8CC] mb-4">
          <button
            type="button"
            onClick={() => setOrderType('market')}
            className={`flex-1 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
              orderType === 'market'
                ? 'bg-[#122A22] text-[#F7F5EF] shadow-xs'
                : 'text-[#6B6858] hover:text-[#122A22]'
            }`}
          >
            Market Order
          </button>
          <button
            type="button"
            onClick={() => {
              setOrderType('limit');
              if (!limitPrice || limitPrice === '0') {
                setLimitPrice(String(currentPrice));
              }
            }}
            className={`flex-1 py-1.5 text-xs font-mono font-medium rounded transition-colors ${
              orderType === 'limit'
                ? 'bg-[#122A22] text-[#F7F5EF] shadow-xs'
                : 'text-[#6B6858] hover:text-[#122A22]'
            }`}
          >
            Limit Order
          </button>
        </div>

        {/* US Stocks Investment Mode Switcher: INR vs USD vs Shares */}
        {isUsd && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono text-[#6B6858] uppercase">
                Choose Investment Mode:
              </span>
              <span className="text-[10px] font-mono text-[#B8935F]">
                Fractional Shares Enabled
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-0.5 bg-[#F7F5EF] rounded border border-[#DDD8CC]">
              <button
                type="button"
                onClick={() => setInputMode('inr')}
                className={`py-1 text-xs font-mono rounded transition-colors ${
                  inputMode === 'inr'
                    ? 'bg-[#122A22] text-[#F7F5EF] font-semibold shadow-xs'
                    : 'text-[#6B6858] hover:text-[#122A22]'
                }`}
              >
                ₹ In Rupees
              </button>
              <button
                type="button"
                onClick={() => setInputMode('usd')}
                className={`py-1 text-xs font-mono rounded transition-colors ${
                  inputMode === 'usd'
                    ? 'bg-[#122A22] text-[#F7F5EF] font-semibold shadow-xs'
                    : 'text-[#6B6858] hover:text-[#122A22]'
                }`}
              >
                $ In Dollars
              </button>
              <button
                type="button"
                onClick={() => setInputMode('shares')}
                className={`py-1 text-xs font-mono rounded transition-colors ${
                  inputMode === 'shares'
                    ? 'bg-[#122A22] text-[#F7F5EF] font-semibold shadow-xs'
                    : 'text-[#6B6858] hover:text-[#122A22]'
                }`}
              >
                By Shares
              </button>
            </div>
          </div>
        )}

        {/* INPUT SECTION A: Invest in INR (US Stocks) */}
        {isUsd && inputMode === 'inr' && (
          <div className="mb-4">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <label className="text-xs font-mono text-[#6B6858] uppercase" htmlFor="amount-inr">
                Investment Amount (₹)
              </label>
              <span className="text-xs font-mono text-[#14140F]">
                {priceTag}: {formatPrice(currentPrice, currency)}
              </span>
            </div>

            <div className="relative mb-2">
              <span className="absolute left-3 top-2 font-mono text-sm text-[#6B6858]">₹</span>
              <input
                id="amount-inr"
                type="number"
                min={100}
                step={100}
                value={amountInr}
                onChange={(e) => setAmountInr(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full h-9 pl-7 pr-3 border border-[#DDD8CC] rounded-md text-sm text-[#14140F] bg-[#F7F5EF] focus:outline-none focus:ring-1 focus:ring-[#122A22] font-mono"
              />
            </div>

            {/* Quick INR Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-[#6B6858]">Presets:</span>
              {[1000, 2500, 5000, 10000, 25000].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountInr(String(preset))}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                    Number(amountInr) === preset
                      ? 'bg-[#122A22] text-[#F7F5EF] border-[#122A22]'
                      : 'bg-white text-[#6B6858] border-[#DDD8CC] hover:bg-[#F7F5EF]'
                  }`}
                >
                  ₹{preset.toLocaleString('en-IN')}
                </button>
              ))}
            </div>

            {/* Dynamic Two-Way Conversion Note */}
            <div className="mt-2 text-[11px] font-mono text-[#2F6B4F] bg-[#E8F3ED] p-2 rounded border border-[#C5DDD2]">
              <div className="flex justify-between items-center">
                <span>Equivalent in USD:</span>
                <span className="font-semibold">${estimatedUsd.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>You will receive:</span>
                <span className="font-semibold font-mono text-[#122A22]">
                  {calculatedShares} shares of {symbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* INPUT SECTION B: Invest in USD (US Stocks) */}
        {isUsd && inputMode === 'usd' && (
          <div className="mb-4">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <label className="text-xs font-mono text-[#6B6858] uppercase" htmlFor="amount-usd">
                Investment Amount ($)
              </label>
              <span className="text-xs font-mono text-[#14140F]">
                {priceTag}: {formatPrice(currentPrice, currency)}
              </span>
            </div>

            <div className="relative mb-2">
              <span className="absolute left-3 top-2 font-mono text-sm text-[#6B6858]">$</span>
              <input
                id="amount-usd"
                type="number"
                min={1}
                step={5}
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                placeholder="e.g. 100"
                className="w-full h-9 pl-7 pr-3 border border-[#DDD8CC] rounded-md text-sm text-[#14140F] bg-[#F7F5EF] focus:outline-none focus:ring-1 focus:ring-[#122A22] font-mono"
              />
            </div>

            {/* Quick USD Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-[#6B6858]">Presets:</span>
              {[25, 50, 100, 250, 500].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmountUsd(String(preset))}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                    Number(amountUsd) === preset
                      ? 'bg-[#122A22] text-[#F7F5EF] border-[#122A22]'
                      : 'bg-white text-[#6B6858] border-[#DDD8CC] hover:bg-[#F7F5EF]'
                  }`}
                >
                  ${preset}
                </button>
              ))}
            </div>

            {/* Dynamic Two-Way Conversion Note */}
            <div className="mt-2 text-[11px] font-mono text-[#2F6B4F] bg-[#E8F3ED] p-2 rounded border border-[#C5DDD2]">
              <div className="flex justify-between items-center">
                <span>Equivalent in INR:</span>
                <span className="font-semibold">₹{estimatedInr.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span>You will receive:</span>
                <span className="font-semibold font-mono text-[#122A22]">
                  {calculatedShares} shares of {symbol}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* INPUT SECTION C: By Shares Quantity (US fractional or Indian whole shares) */}
        {(!isUsd || inputMode === 'shares') && (
          <div className="mb-4">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <label className="text-xs font-mono text-[#6B6858] uppercase" htmlFor="trade-quantity">
                {isUsd ? 'Shares Quantity (Fractional Allowed)' : 'Shares (Qty)'}
              </label>
              <span className="text-xs font-mono text-[#14140F] text-right truncate">
                {priceTag}: {formatPrice(currentPrice, currency)}
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                id="trade-quantity"
                type="number"
                min={isUsd ? 0.0001 : 1}
                step={isUsd ? 0.01 : 1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                className="min-w-0 flex-1 h-9 border border-[#DDD8CC] rounded-md px-3 text-sm text-[#14140F] bg-[#F7F5EF] focus:outline-none focus:ring-1 focus:ring-[#122A22] font-mono"
              />
              <button
                type="button"
                onClick={() => {
                  const cur = parseFloat(quantity) || 0;
                  const step = isUsd ? 0.1 : 1;
                  const next = Math.max(step, cur - step);
                  setQuantity(isUsd ? String(Number(next.toFixed(4))) : String(Math.floor(next)));
                }}
                className="shrink-0 w-9 h-9 border border-[#DDD8CC] rounded-md flex items-center justify-center text-base font-mono text-[#14140F] bg-white hover:bg-[#F7F5EF] active:bg-[#EFEDE4] transition-colors shadow-xs"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <button
                type="button"
                onClick={() => {
                  const cur = parseFloat(quantity) || 0;
                  const step = isUsd ? 0.1 : 1;
                  const next = cur + step;
                  setQuantity(isUsd ? String(Number(next.toFixed(4))) : String(Math.floor(next)));
                }}
                className="shrink-0 w-9 h-9 border border-[#DDD8CC] rounded-md flex items-center justify-center text-base font-mono text-[#14140F] bg-white hover:bg-[#F7F5EF] active:bg-[#EFEDE4] transition-colors shadow-xs"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-mono text-[#6B6858]">Presets:</span>
              {(isUsd ? [0.25, 0.5, 1, 2, 5] : [1, 5, 10, 25, 50]).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantity(String(preset))}
                  className={`px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
                    parseFloat(quantity) === preset
                      ? 'bg-[#122A22] text-[#F7F5EF] border-[#122A22]'
                      : 'bg-white text-[#6B6858] border-[#DDD8CC] hover:bg-[#F7F5EF]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Limit Price Input (Only for Limit Orders) */}
        {orderType === 'limit' && (
          <div className="mb-4 p-3 rounded bg-[#FBF9F4] border border-[#EFEDE4]">
            <div className="flex items-center justify-between gap-1 mb-1.5">
              <label className="text-xs font-mono text-[#6B6858] uppercase" htmlFor="limit-price">
                Desired Limit Price ({isUsd ? '$' : '₹'})
              </label>
              <span className="text-[11px] font-mono text-[#B8935F]">
                Target Price ({currency})
              </span>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <input
                id="limit-price"
                type="number"
                step={isUsd ? '0.01' : '0.05'}
                min={isUsd ? '0.01' : '0.05'}
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder={`e.g. ${currentPrice}`}
                className="min-w-0 flex-1 h-9 border border-[#DDD8CC] rounded-md px-3 text-sm text-[#14140F] bg-white focus:outline-none focus:ring-1 focus:ring-[#122A22] font-mono"
              />
              <button
                type="button"
                onClick={() => addQuickLimitPrice(-1)}
                className="shrink-0 w-9 h-9 border border-[#DDD8CC] rounded-md flex items-center justify-center text-base font-mono text-[#14140F] bg-white hover:bg-[#F7F5EF] active:bg-[#EFEDE4] transition-colors shadow-xs"
                title={`Decrease limit price by ${isUsd ? '$1' : '₹1'}`}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => addQuickLimitPrice(1)}
                className="shrink-0 w-9 h-9 border border-[#DDD8CC] rounded-md flex items-center justify-center text-base font-mono text-[#14140F] bg-white hover:bg-[#F7F5EF] active:bg-[#EFEDE4] transition-colors shadow-xs"
                title={`Increase limit price by ${isUsd ? '$1' : '₹1'}`}
              >
                +
              </button>
            </div>

            {/* Quick Limit Percentage Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-[#6B6858]">
              <span>Quick Presets:</span>
              <button
                type="button"
                onClick={() => setPercentLimitPrice(-5)}
                className="px-1.5 py-0.5 rounded border border-[#DDD8CC] bg-white hover:bg-[#F7F5EF] text-[#2F6B4F]"
              >
                -5%
              </button>
              <button
                type="button"
                onClick={() => setPercentLimitPrice(-2)}
                className="px-1.5 py-0.5 rounded border border-[#DDD8CC] bg-white hover:bg-[#F7F5EF] text-[#2F6B4F]"
              >
                -2%
              </button>
              <button
                type="button"
                onClick={() => setLimitPrice(String(currentPrice))}
                className="px-1.5 py-0.5 rounded border border-[#DDD8CC] bg-white hover:bg-[#F7F5EF] text-[#122A22]"
              >
                At Market
              </button>
              <button
                type="button"
                onClick={() => setPercentLimitPrice(2)}
                className="px-1.5 py-0.5 rounded border border-[#DDD8CC] bg-white hover:bg-[#F7F5EF] text-[#9B3A32]"
              >
                +2%
              </button>
              <button
                type="button"
                onClick={() => setPercentLimitPrice(5)}
                className="px-1.5 py-0.5 rounded border border-[#DDD8CC] bg-white hover:bg-[#F7F5EF] text-[#9B3A32]"
              >
                +5%
              </button>
            </div>

            {/* Explanatory helper text */}
            <p className="mt-2 text-[11px] font-mono text-[#6B6858] leading-relaxed">
              {numLimitPrice < currentPrice ? (
                <span>
                  📉 <strong>Buy:</strong> Triggers when price drops to {formatPrice(numLimitPrice, currency)} or below.
                </span>
              ) : numLimitPrice > currentPrice ? (
                <span>
                  📈 <strong>Sell:</strong> Triggers when price rises to {formatPrice(numLimitPrice, currency)} or above.
                </span>
              ) : (
                <span>
                  ● Equal to current price — will execute immediately if placed.
                </span>
              )}
            </p>
          </div>
        )}

        {/* Order Summary box */}
        <div className="p-3 rounded bg-[#F7F5EF] border border-[#DDD8CC] mb-4 space-y-1.5">
          {isUsd ? (
            <>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#6B6858]">Shares to receive:</span>
                <span className="font-bold text-[#122A22]">
                  {calculatedShares} {symbol}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#6B6858]">Order Value (USD):</span>
                <span className="font-semibold text-[#14140F]">
                  ${estimatedUsd.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono border-t border-[#DDD8CC] pt-1 mt-1">
                <span className="text-[#122A22] font-semibold">Wallet Deduction (INR):</span>
                <span className="font-bold text-[#122A22] text-sm">
                  ₹{estimatedInr.toFixed(2)}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#6B6858]">
                {orderType === 'market' ? 'Estimated Market Value:' : 'Estimated Order Value:'}
              </span>
              <span className="font-semibold text-[#14140F] text-sm">
                {formatPrice(estimatedInr, currency)}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] font-mono text-[#6B6858]">
            <span>Execution Type:</span>
            <span className="text-[#122A22]">
              {orderType === 'market'
                ? 'Immediate at Market Price'
                : `Pending Trigger at ${formatPrice(numLimitPrice, currency)}`}
            </span>
          </div>
        </div>
      </div>

      <div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!!loading || calculatedShares <= 0}
            onClick={() => submit('buy')}
            className="flex-1 py-2.5 text-xs font-mono uppercase tracking-wider bg-[#2F6B4F] text-[#F7F5EF] rounded-md font-semibold hover:bg-[#25563F] disabled:opacity-60 transition-colors shadow-xs"
          >
            {loading === 'buy'
              ? 'Processing...'
              : orderType === 'market'
              ? `Buy `
              : `Limit Buy `}
          </button>
          <button
            type="button"
            disabled={!!loading || calculatedShares <= 0}
            onClick={() => submit('sell')}
            className="flex-1 py-2.5 text-xs font-mono uppercase tracking-wider bg-[#9B3A32] text-[#F7F5EF] rounded-md font-semibold hover:bg-[#7F2F29] disabled:opacity-60 transition-colors shadow-xs"
          >
            {loading === 'sell'
              ? 'Processing...'
              : orderType === 'market'
              ? `Sell `
              : `Limit Sell`}
          </button>
        </div>

        {guest && (
          <p className="mt-2 text-center text-[11px] text-[#6B6858]">
            Account required to execute virtual orders.
          </p>
        )}

        {message && (
          <div className="mt-3 p-2.5 rounded bg-emerald-50 border border-emerald-200 text-xs text-[#2F6B4F] leading-relaxed">
            ✓ {message}
          </div>
        )}
        {error && (
          <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-[#9B3A32] leading-relaxed">
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
}
