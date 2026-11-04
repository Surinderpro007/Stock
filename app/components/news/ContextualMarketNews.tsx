'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchNews, type MarketNewsItem } from '../../lib/api/news';

interface ContextualMarketNewsProps {
  title?: string;
  subtitle?: string;
  category?: string;
  symbol?: string;
  limit?: number;
  viewAllLink?: boolean;
}

export default function ContextualMarketNews({
  title = 'Market Intelligence & News Wire',
  subtitle = 'Live market developments, earnings, and regulatory updates',
  category,
  symbol,
  limit = 4,
  viewAllLink = true,
}: ContextualMarketNewsProps) {
  const [items, setItems] = useState<MarketNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function getNews() {
      setLoading(true);
      setError('');
      try {
        const res = await fetchNews({
          category,
          symbol,
          limit,
        });
        if (!cancelled && res.news) {
          setItems(res.news.slice(0, limit));
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Unable to load news');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    getNews();
    return () => {
      cancelled = true;
    };
  }, [category, symbol, limit]);

  return (
    <div className="border border-[#DDD8CC] rounded-md bg-white p-6 shadow-xs mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 mb-4 border-b border-[#EFEDE4]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="font-mono text-xs tracking-[0.2em] text-[#B8935F] uppercase">
              {symbol ? `${symbol} News Wire` : 'Market News Wire'}
            </p>
          </div>
          <h2 className="font-serif text-xl text-[#14140F]">{title}</h2>
          <p className="text-xs text-[#6B6858] mt-0.5">{subtitle}</p>
        </div>

        {viewAllLink && (
          <Link
            href="/news"
            className="text-xs font-mono text-[#122A22] hover:text-[#B8935F] hover:underline flex items-center gap-1 self-start sm:self-auto font-medium"
          >
            <span>All Market News</span>
            <span>→</span>
          </Link>
        )}
      </div>

      {loading && items.length === 0 && (
        <div className="py-8 text-center text-xs text-[#6B6858] font-mono animate-pulse">
          Loading market news...
        </div>
      )}

      {!loading && error && items.length === 0 && (
        <div className="py-4 text-center text-xs text-[#9B3A32]">
          {error}
        </div>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="group p-4 rounded-md border border-[#EFEDE4] hover:border-[#DDD8CC] hover:bg-[#FBF9F4] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2 text-[11px] font-mono text-[#6B6858]">
                  <span className="px-1.5 py-0.5 rounded bg-[#F7F5EF] text-[#122A22] font-medium border border-[#DDD8CC]">
                    {item.source}
                  </span>
                  <span>{item.timeAgo}</span>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-medium text-sm text-[#14140F] group-hover:text-[#122A22] leading-snug mb-1.5"
                >
                  {item.title}
                  <span className="inline-block ml-1 text-[#B8935F] opacity-0 group-hover:opacity-100 transition-opacity">
                    ↗
                  </span>
                </a>

                {item.snippet && (
                  <p className="text-xs text-[#6B6858] line-clamp-2 leading-relaxed">
                    {item.snippet}
                  </p>
                )}
              </div>

              {item.symbols && item.symbols.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-[#EFEDE4] flex-wrap">
                  <span className="text-[10px] font-mono text-[#6B6858]">Stocks:</span>
                  {item.symbols.map((sym) => (
                    <Link
                      key={sym}
                      href={`/stocks/${sym}`}
                      className="text-[10px] font-mono px-1.5 py-0.5 bg-[#122A22] text-[#F7F5EF] rounded hover:bg-[#0D1F19] transition-colors"
                    >
                      {sym}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
