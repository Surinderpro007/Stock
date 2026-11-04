'use client';

import { useState, useEffect } from 'react';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
} as const;

function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?'
  );
}

/**
 * Extract the bare domain from a direct favicon URL.
 * Supports:
 *   "https://apple.com/favicon.ico"      → "apple.com"
 *   "https://icons.duckduckgo.com/ip3/apple.com.ico" → "apple.com"
 */
function domainFromLogoUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  // Direct favicon: https://{domain}/favicon.ico
  const directMatch = url.match(/^https?:\/\/([^/]+)\/favicon\.ico$/i);
  if (directMatch) return directMatch[1].replace(/^www\./, '');

  // DuckDuckGo favicon: https://icons.duckduckgo.com/ip3/{domain}.ico
  const ddgMatch = url.match(/\/ip3\/([^/]+)\.ico$/);
  if (ddgMatch) return ddgMatch[1];

  return null;
}

/**
 * Build the ordered list of image sources to try for a given stock.
 *
 * Fallback chain:
 *   1. Direct company favicon   — https://{domain}/favicon.ico (primary)
 *   2. Google favicon service   — www.google.com/s2/favicons?domain=...&sz=128
 *   3. Local /logos/*.svg       — bundled SVG placeholder (Indian stocks)
 *   4. Company initials         — always renders (handled outside this array)
 *
 * NOTE: Clearbit (logo.clearbit.com) removed — discontinued, DNS NXDOMAIN.
 * NOTE: DuckDuckGo (icons.duckduckgo.com) skipped — unreliable in some networks.
 */
function buildFallbackChain(
  logoUrl: string | null | undefined,
  symbol: string | undefined,
): string[] {
  const domain = domainFromLogoUrl(logoUrl);

  const candidates: (string | null | undefined)[] = [
    logoUrl,                                                                                         // 1. Primary (direct favicon or DDG)
    domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128` : null, // 2. Google favicon
    symbol ? `/logos/${symbol.trim().toLowerCase()}.svg` : null,                                     // 3. Local SVG
  ];

  return candidates.filter((u): u is string => typeof u === 'string' && u.length > 0);
}

/**
 * Company logo component.
 *
 * Tries direct company favicon → Google favicon → local SVG placeholder → company initials.
 * All external logo sources are tried automatically via onError chaining.
 */
export default function StockLogo({
  name,
  logoUrl,
  symbol,
  size = 'sm',
}: {
  name: string;
  logoUrl?: string | null;
  symbol?: string;
  size?: keyof typeof SIZES;
}) {
  const [urls, setUrls] = useState<string[]>(() => buildFallbackChain(logoUrl, symbol));
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    setUrls(buildFallbackChain(logoUrl, symbol));
    setIdx(0);
  }, [logoUrl, symbol]);

  const src = urls[idx] ?? null;

  // All URLs exhausted — render company initials
  if (!src) {
    return (
      <span
        aria-hidden="true"
        className={`${SIZES[size]} shrink-0 rounded-md bg-[#ECE9DF] text-[#6B6858] flex items-center justify-center font-semibold shadow-xs`}
        title={name}
      >
        {initialsOf(name)}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${name} logo`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setIdx((i) => i + 1)}
      className={`${SIZES[size]} shrink-0 rounded-md border border-[#DDD8CC] bg-white object-contain p-1 shadow-xs`}
    />
  );
}
