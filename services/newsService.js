const INDIAN_STOCK_SYMBOLS = [
  'RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK',
  'SBIN', 'ITC', 'HINDUNILVR', 'bhartiartl', 'LT',
  'BAJFINANCE', 'MARUTI', 'ASIANPAINT', 'AXISBANK',
  'KOTAKBANK', 'SUNPHARMA', 'TITAN', 'WIPRO',
  'ULTRACEMCO', 'NESTLEIND'
];

const SYMBOL_KEYWORDS = {
  RELIANCE: ['reliance', 'jio', 'mukesh ambani'],
  TCS: ['tcs', 'tata consultancy'],
  INFY: ['infosys', 'infy', 'salil parekh'],
  HDFCBANK: ['hdfc bank', 'hdfc'],
  ICICIBANK: ['icici bank', 'icici'],
  SBIN: ['state bank of india', 'sbi', 'sbin'],
  ITC: ['itc', 'itc hotels'],
  HINDUNILVR: ['hindustan unilever', 'hul'],
  bhartiartl: ['bharti airtel', 'airtel'],
  LT: ['larsen & toubro', 'l&t', 'larsen'],
  BAJFINANCE: ['bajaj finance', 'bajaj finserv'],
  MARUTI: ['maruti suzuki', 'maruti'],
  ASIANPAINT: ['asian paints'],
  AXISBANK: ['axis bank'],
  KOTAKBANK: ['kotak mahindra', 'kotak bank'],
  SUNPHARMA: ['sun pharma', 'sun pharmaceutical'],
  TITAN: ['titan', 'tanishq'],
  WIPRO: ['wipro'],
  ULTRACEMCO: ['ultratech cement', 'ultratech'],
  NESTLEIND: ['nestle india', 'nestle']
};

function getTimeAgo(dateStr) {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (isNaN(diffSec) || diffSec < 0) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

function detectSymbols(text) {
  const lower = text.toLowerCase();
  const matched = [];

  for (const [sym, keywords] of Object.entries(SYMBOL_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      matched.push(sym);
    }
  }

  return matched;
}

function categorizeArticle(title, snippet = '') {
  const combined = (title + ' ' + snippet).toLowerCase();
  if (combined.includes('q1') || combined.includes('q2') || combined.includes('q3') || combined.includes('q4') || combined.includes('result') || combined.includes('profit') || combined.includes('earnings') || combined.includes('revenue')) {
    return 'Earnings';
  }
  if (combined.includes('rbi') || combined.includes('inflation') || combined.includes('gdp') || combined.includes('economy') || combined.includes('repo') || combined.includes('policy') || combined.includes('fed')) {
    return 'Economy';
  }
  if (combined.includes('deal') || combined.includes('acquisition') || combined.includes('stake') || combined.includes('launch') || combined.includes('ceo') || combined.includes('board')) {
    return 'Corporates';
  }
  if (combined.includes('ipo') || combined.includes('listing') || combined.includes('debut')) {
    return 'IPO';
  }
  return 'Markets';
}

function cleanHtml(raw) {
  return raw
    .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, '')
    .trim();
}

function getFallbackNews() {
  const now = Date.now();
  return [
    {
      id: 'fb-1',
      title: 'Nifty 50 and Sensex extend gains led by banking and IT heavyweights',
      source: 'The Economic Times',
      link: 'https://economictimes.indiatimes.com/markets',
      pubDate: new Date(now - 12 * 60 * 1000).toISOString(),
      timeAgo: '12m ago',
      category: 'Markets',
      snippet: 'Indian benchmark equity indices opened on a firm footing today, with strong buying interest in banking leaders HDFC Bank, ICICI Bank, and tech giants TCS and Infosys.',
      symbols: ['HDFCBANK', 'ICICIBANK', 'TCS', 'INFY'],
    },
    {
      id: 'fb-2',
      title: 'Reliance Industries announces expansion into new green energy mega-facilities',
      source: 'Livemint',
      link: 'https://www.livemint.com/market',
      pubDate: new Date(now - 38 * 60 * 1000).toISOString(),
      timeAgo: '38m ago',
      category: 'Corporates',
      snippet: 'Reliance Industries highlighted strong operational synergies across its telecom, retail, and renewable energy investments, attracting positive institutional commentary.',
      symbols: ['RELIANCE'],
    },
    {
      id: 'fb-3',
      title: 'TCS and Infosys bag key multi-year global digital transformation contracts',
      source: 'Business Standard',
      link: 'https://www.business-standard.com/markets',
      pubDate: new Date(now - 75 * 60 * 1000).toISOString(),
      timeAgo: '1h ago',
      category: 'Earnings',
      snippet: 'Indian IT bellwethers report strong momentum in AI-led engineering solutions and sovereign cloud transitions across European and North American enterprise clients.',
      symbols: ['TCS', 'INFY', 'WIPRO'],
    },
    {
      id: 'fb-4',
      title: 'RBI maintains accommodative policy stance with focus on domestic growth and liquidity',
      source: 'Moneycontrol',
      link: 'https://www.moneycontrol.com/news/business/economy',
      pubDate: new Date(now - 140 * 60 * 1000).toISOString(),
      timeAgo: '2h ago',
      category: 'Economy',
      snippet: 'The Reserve Bank of India reiterated strong resilience in macroeconomic fundamentals, keeping domestic investment appetite robust amid global interest rate cycles.',
      symbols: ['SBIN', 'HDFCBANK', 'AXISBANK'],
    },
    {
      id: 'fb-5',
      title: 'Auto sector revs up: Maruti Suzuki and Tata Motors post robust monthly dispatches',
      source: 'NDTV Profit',
      link: 'https://www.ndtvprofit.com/markets',
      pubDate: new Date(now - 210 * 60 * 1000).toISOString(),
      timeAgo: '3h ago',
      category: 'Corporates',
      snippet: 'Passenger vehicle dispatches reached record volumes ahead of festive demand, backed by premium SUV preference and strong rural sales recovery.',
      symbols: ['MARUTI', 'BAJFINANCE'],
    },
    {
      id: 'fb-6',
      title: 'FII and DII institutional flows turn net positive across large-cap Indian counters',
      source: 'Financial Express',
      link: 'https://www.financialexpress.com/market',
      pubDate: new Date(now - 300 * 60 * 1000).toISOString(),
      timeAgo: '5h ago',
      category: 'Markets',
      snippet: 'Foreign institutional investors infused fresh equity capital across private lenders and infrastructure titans like Larsen & Toubro and UltraTech Cement.',
      symbols: ['LT', 'ULTRACEMCO', 'KOTAKBANK'],
    },
  ];
}

module.exports = {
  INDIAN_STOCK_SYMBOLS,
  SYMBOL_KEYWORDS,
  getTimeAgo,
  detectSymbols,
  categorizeArticle,
  cleanHtml,
  getFallbackNews,
};
