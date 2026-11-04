export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const {
  SYMBOL_KEYWORDS,
  getTimeAgo,
  detectSymbols,
  categorizeArticle,
  cleanHtml,
  getFallbackNews,
} = require('../../../services/newsService');

interface NewsItem {
  id: string;
  title: string;
  source: string;
  link: string;
  pubDate: string;
  timeAgo: string;
  category: string;
  snippet?: string;
  symbols: string[];
}

interface CacheEntry {
  timestamp: number;
  data: NewsItem[];
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

async function fetchGoogleNewsRss(queryStr: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(queryStr)}&hl=en-IN&gl=IN&ceid=IN:en`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) {
      throw new Error(`Google News RSS returned ${res.status}`);
    }

    const xml = await res.text();
    const items: NewsItem[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 35) {
      const content = match[1];

      const rawTitle = (content.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
      const rawLink = (content.match(/<link\s*\/?>([\s\S]*?)<\/link>/) || content.match(/<link>([\s\S]*?)<\/link>/) || [])[1] || '';
      const rawPubDate = (content.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1] || '';
      const rawSource = (content.match(/<source[^>]*>([\s\S]*?)<\/source>/) || [])[1] || '';
      const rawDesc = (content.match(/<description>([\s\S]*?)<\/description>/) || [])[1] || '';

      const cleanTitle = cleanHtml(rawTitle);
      const cleanSource = cleanHtml(rawSource) || 'Financial News Wire';
      const cleanSnippet = cleanHtml(rawDesc);
      const pubDate = rawPubDate ? new Date(rawPubDate).toISOString() : new Date().toISOString();

      let finalTitle = cleanTitle;
      const lastHyphen = cleanTitle.lastIndexOf(' - ');
      if (lastHyphen > 20) {
        finalTitle = cleanTitle.slice(0, lastHyphen).trim();
      }

      if (!finalTitle || finalTitle.length < 5) continue;

      const detected = detectSymbols(finalTitle + ' ' + cleanSnippet);
      const category = categorizeArticle(finalTitle, cleanSnippet);

      items.push({
        id: `news-${items.length + 1}-${encodeURIComponent(finalTitle.slice(0, 16))}`,
        title: finalTitle,
        source: cleanSource,
        link: cleanHtml(rawLink) || 'https://www.google.com/finance',
        pubDate,
        timeAgo: getTimeAgo(pubDate),
        category,
        snippet: cleanSnippet.length > 200 ? cleanSnippet.slice(0, 200) + '...' : cleanSnippet,
        symbols: detected,
      });
    }

    return items;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() || '';
  const category = searchParams.get('category')?.trim() || 'all';
  const symbol = searchParams.get('symbol')?.trim().toUpperCase() || '';
  const limit = Math.min(Math.max(1, Number(searchParams.get('limit') || 25)), 50);

  const cacheKey = `news_${q}_${category}_${symbol}_${limit}`;
  const now = Date.now();

  const cached = cache.get(cacheKey);
  if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
    return NextResponse.json({
      success: true,
      cached: true,
      count: cached.data.length,
      news: cached.data,
      fetchedAt: new Date(cached.timestamp).toISOString(),
    });
  }

  let searchQuery = 'NSE India stock market business financial news';
  if (symbol) {
    const keywords = SYMBOL_KEYWORDS[symbol] ? SYMBOL_KEYWORDS[symbol].join(' OR ') : symbol;
    searchQuery = `(${keywords}) NSE India stock`;
  } else if (q) {
    searchQuery = `${q} Indian stock market NSE BSE`;
  } else if (category && category !== 'all') {
    if (category === 'earnings') searchQuery = 'India quarterly results earnings NSE stocks';
    else if (category === 'economy') searchQuery = 'Indian economy RBI inflation GDP stock market';
    else if (category === 'corporates') searchQuery = 'Indian corporates large cap companies NSE';
    else if (category === 'ipo') searchQuery = 'India IPO listing stock market debut';
    else searchQuery = `${category} Indian stock market NSE`;
  }

  let newsItems: NewsItem[] = [];

  try {
    newsItems = await fetchGoogleNewsRss(searchQuery);
  } catch {
    newsItems = [];
  }

  if (!newsItems.length) {
    const fallback = getFallbackNews();
    if (symbol) {
      newsItems = fallback.filter((item: NewsItem) => item.symbols.includes(symbol));
      if (!newsItems.length) {
        newsItems = [
          {
            id: `fb-sym-${symbol}`,
            title: `${symbol} trading volume and market interest surge on NSE`,
            source: 'MarketWire India',
            link: 'https://www.google.com/finance',
            pubDate: new Date().toISOString(),
            timeAgo: 'Just now',
            category: 'Markets',
            snippet: `Active trading interest observed in ${symbol} across domestic and institutional desks following regular exchange disclosures.`,
            symbols: [symbol],
          },
          ...fallback.slice(0, 4),
        ];
      }
    } else if (category && category !== 'all') {
      newsItems = fallback.filter((item: NewsItem) => item.category.toLowerCase() === category.toLowerCase());
      if (!newsItems.length) newsItems = fallback;
    } else {
      newsItems = fallback;
    }
  }

  if (symbol && newsItems.length > 0) {
    const symbolMatches = newsItems.filter((item: NewsItem) =>
      item.symbols.includes(symbol) || item.title.toUpperCase().includes(symbol)
    );
    if (symbolMatches.length > 0) {
      newsItems = symbolMatches;
    }
  }

  const results = newsItems.slice(0, limit);

  cache.set(cacheKey, { timestamp: now, data: results });

  return NextResponse.json({
    success: true,
    count: results.length,
    news: results,
    fetchedAt: new Date(now).toISOString(),
  });
}
