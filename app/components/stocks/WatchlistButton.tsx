'use client';

import { useState } from 'react';

interface WatchlistButtonProps {
  symbol: string;
  isWatched: boolean;
  onToggle: (symbol: string) => Promise<any> | void;
  guest?: boolean;
  onGuestClick?: () => void;
  showLabel?: boolean;
  className?: string;
}

export default function WatchlistButton({
  symbol,
  isWatched,
  onToggle,
  guest = false,
  onGuestClick,
  showLabel = false,
  className = '',
}: WatchlistButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (guest && onGuestClick) {
      onGuestClick();
      return;
    }

    try {
      setLoading(true);
      await onToggle(symbol);
    } catch {
      // Handled in parent/hook
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      aria-label={isWatched ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      title={isWatched ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
      className={`inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 ${className} ${
        isWatched
          ? 'text-[#B8935F] hover:text-[#9A7A4E]'
          : 'text-[#8E8B7B] hover:text-[#122A22]'
      }`}
    >
      <span className={`text-base leading-none transition-transform ${isWatched ? 'scale-110' : ''}`}>
        {isWatched ? '★' : '☆'}
      </span>
      {showLabel && (
        <span className="text-xs font-mono font-medium">
          {isWatched ? 'Watchlisted' : 'Watchlist'}
        </span>
      )}
    </button>
  );
}
