/**
 * US Stock listing definitions (real top US companies).
 *
 * Live prices, historical charts, day/52-week ranges, volume, and market caps
 * are fetched dynamically through the market feed (Yahoo Finance US endpoints).
 *
 * Tickers use standard US symbols (e.g. AAPL, MSFT, NVDA, TSLA) without suffixes.
 */
const US_STOCKS = [
  {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    sector: 'Information Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    market: 'US',
    website: 'apple.com',
    description:
      'Designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories, and sells a variety of related services.',
    basePrice: 230.5,
    marketCap: 3500000000000,
  },
  {
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    sector: 'Information Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    market: 'US',
    website: 'microsoft.com',
    description:
      'Global technology company delivering cloud computing (Azure), enterprise software, productivity applications, and artificial intelligence solutions.',
    basePrice: 428.15,
    marketCap: 3180000000000,
  },
  {
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    sector: 'Information Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    market: 'US',
    website: 'nvidia.com',
    description:
      'Pioneer in GPU-accelerated computing and the global leader in semiconductor hardware and systems for artificial intelligence and high-performance computing.',
    basePrice: 138.25,
    marketCap: 3390000000000,
  },
  {
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    sector: 'Information Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    market: 'US',
    website: 'abc.xyz',
    description:
      'Parent company of Google, YouTube, and Android. Specializes in internet search, cloud computing, digital advertising, software, and quantum computing.',
    basePrice: 172.6,
    marketCap: 2120000000000,
  },
  {
    symbol: 'AMZN',
    companyName: 'Amazon.com Inc.',
    sector: 'Consumer Durables',
    exchange: 'NASDAQ',
    currency: 'USD',
    market: 'US',
    website: 'amazon.com',
    description:
      'Leading e-commerce, cloud computing (AWS), digital streaming, and artificial intelligence company serving global retail and enterprise customers.',
    basePrice: 187.9,
    marketCap: 1960000000000,
  },
  {
    symbol: 'META',
    companyName: 'Meta Platforms Inc.',
    sector: 'Information Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    market: 'US',
    website: 'meta.com',
    description:
      'Builds technologies that help people connect and discover communities, including Facebook, Instagram, WhatsApp, Messenger, and Reality Labs.',
    basePrice: 591.8,
    marketCap: 1490000000000,
  },
  {
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    sector: 'Automobile',
    exchange: 'NASDAQ',
    currency: 'USD',
    market: 'US',
    website: 'tesla.com',
    description:
      'Designs and manufactures fully electric vehicles, energy storage systems, solar roof products, and autonomous driving technology.',
    basePrice: 259.4,
    marketCap: 828000000000,
  },
  {
    symbol: 'JPM',
    companyName: 'JPMorgan Chase & Co.',
    sector: 'Banking',
    exchange: 'NYSE',
    currency: 'USD',
    market: 'US',
    website: 'jpmorganchase.com',
    description:
      'The largest financial services firm in the United States, providing investment banking, asset management, treasury, and commercial banking services.',
    basePrice: 221.75,
    marketCap: 635000000000,
  },
  {
    symbol: 'V',
    companyName: 'Visa Inc.',
    sector: 'Banking',
    exchange: 'NYSE',
    currency: 'USD',
    market: 'US',
    website: 'visa.com',
    description:
      'World leader in digital payments, facilitating electronic funds transfers and card payment authorization worldwide.',
    basePrice: 284.1,
    marketCap: 580000000000,
  },
  {
    symbol: 'JNJ',
    companyName: 'Johnson & Johnson',
    sector: 'Pharmaceuticals',
    exchange: 'NYSE',
    currency: 'USD',
    market: 'US',
    website: 'jnj.com',
    description:
      'Global healthcare conglomerate that researches, develops, and manufactures pharmaceuticals and medtech medical devices.',
    basePrice: 161.35,
    marketCap: 388000000000,
  },
  {
    symbol: 'WMT',
    companyName: 'Walmart Inc.',
    sector: 'FMCG',
    exchange: 'NYSE',
    currency: 'USD',
    market: 'US',
    website: 'walmart.com',
    description:
      'The world’s largest retail company operating a chain of hypermarkets, discount department stores, grocery stores, and e-commerce platforms.',
    basePrice: 82.15,
    marketCap: 660000000000,
  },
  {
    symbol: 'NFLX',
    companyName: 'Netflix Inc.',
    sector: 'Information Technology',
    exchange: 'NASDAQ',
    currency: 'USD',
    market: 'US',
    website: 'netflix.com',
    description:
      'Pioneer of streaming video entertainment, delivering movies, TV series, documentaries, and interactive mobile games to members worldwide.',
    basePrice: 754.2,
    marketCap: 324000000000,
  },
];

module.exports = {
  US_STOCKS,
};
