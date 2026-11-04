/**
 * Stock listing definitions (static company info only).
 *
 * Live prices, previous close, day/52-week range and market cap come from the
 * market feed when `npm run seed:stocks` runs and on every refresh afterwards.
 *
 * To list a new company, add one entry here and run `npm run seed:stocks`:
 *   symbol       NSE ticker without suffix (the feed uses SYMBOL.NS)
 *   website      company domain; the logo is built from it automatically
 *   basePrice /  ONLY used when MARKET_DATA_PROVIDER=simulated (offline
 *   marketCap    development). They are ignored with live data.
 */
const INDIAN_STOCKS = [
  {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd',
    sector: 'Energy',
    website: 'ril.com',
    description:
      'Conglomerate spanning oil-to-chemicals, retail, and digital services. India’s most widely tracked stock.',
    basePrice: 1486.4,
    marketCap: 20150000000000,
  },
  {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services Ltd',
    sector: 'Information Technology',
    website: 'tcs.com',
    description:
      'Largest Indian IT services company, serving global clients in consulting, cloud, and digital transformation.',
    basePrice: 3925.15,
    marketCap: 14220000000000,
  },
  {
    symbol: 'INFY',
    companyName: 'Infosys Ltd',
    sector: 'Information Technology',
    website: 'infosys.com',
    description:
      'Global IT and consulting firm known for digital engineering, AI services, and large enterprise contracts.',
    basePrice: 1842.7,
    marketCap: 7650000000000,
  },
  {
    symbol: 'HDFCBANK',
    companyName: 'HDFC Bank Ltd',
    sector: 'Banking',
    website: 'hdfcbank.com',
    description:
      'India’s largest private sector bank by market cap, with a wide retail and wholesale banking franchise.',
    basePrice: 1728.35,
    marketCap: 13240000000000,
  },
  {
    symbol: 'ICICIBANK',
    companyName: 'ICICI Bank Ltd',
    sector: 'Banking',
    website: 'icicibank.com',
    description:
      'Major private bank with strong retail lending, deposits, and a large digital banking footprint.',
    basePrice: 1364.9,
    marketCap: 9610000000000,
  },
  {
    symbol: 'SBIN',
    companyName: 'State Bank of India',
    sector: 'Banking',
    website: 'sbi.co.in',
    description:
      'India’s largest public sector bank, with nationwide branches and a dominant share of deposits and credit.',
    basePrice: 842.55,
    marketCap: 7520000000000,
  },
  {
    symbol: 'ITC',
    companyName: 'ITC Ltd',
    sector: 'FMCG',
    website: 'itcportal.com',
    description:
      'Diversified FMCG, hotels, paperboards, and agri-business company with a large cigarette and foods portfolio.',
    basePrice: 418.25,
    marketCap: 5230000000000,
  },
  {
    symbol: 'HINDUNILVR',
    companyName: 'Hindustan Unilever Ltd',
    sector: 'FMCG',
    website: 'hul.co.in',
    description:
      'Leading consumer goods company in soaps, detergents, personal care, and packaged foods.',
    basePrice: 2486.1,
    marketCap: 5840000000000,
  },
  {
    symbol: 'bhartiartl',
    companyName: 'Bharti Airtel Ltd',
    sector: 'Telecom',
    website: 'airtel.in',
    description:
      'Pan-India telecom operator offering mobile, broadband, and enterprise connectivity, plus Africa operations.',
    basePrice: 1689.4,
    marketCap: 10120000000000,
  },
  {
    symbol: 'LT',
    companyName: 'Larsen & Toubro Ltd',
    sector: 'Infrastructure',
    website: 'larsentoubro.com',
    description:
      'Engineering and construction major with interests in infrastructure, defence, IT, and financial services.',
    basePrice: 3612.8,
    marketCap: 4960000000000,
  },
  {
    symbol: 'BAJFINANCE',
    companyName: 'Bajaj Finance Ltd',
    sector: 'Financial Services',
    website: 'bajajfinance.in',
    description:
      'Non-bank lender focused on consumer finance, SME loans, and deposits, with a large customer franchise.',
    basePrice: 7248.6,
    marketCap: 4490000000000,
  },
  {
    symbol: 'MARUTI',
    companyName: 'Maruti Suzuki India Ltd',
    sector: 'Automobile',
    website: 'marutisuzuki.com',
    description:
      'India’s largest passenger vehicle manufacturer, with a wide dealer network and strong small-car franchise.',
    basePrice: 12785.3,
    marketCap: 4020000000000,
  },
  {
    symbol: 'ASIANPAINT',
    companyName: 'Asian Paints Ltd',
    sector: 'Consumer Durables',
    website: 'asianpaints.com',
    description:
      'Dominant decorative paints company with expanding home décor, waterproofing, and industrial coatings.',
    basePrice: 2498.75,
    marketCap: 2390000000000,
  },
  {
    symbol: 'AXISBANK',
    companyName: 'Axis Bank Ltd',
    sector: 'Banking',
    website: 'axisbank.com',
    description:
      'Private sector bank with retail, corporate, and treasury businesses across India.',
    basePrice: 1186.45,
    marketCap: 3670000000000,
  },
  {
    symbol: 'KOTAKBANK',
    companyName: 'Kotak Mahindra Bank Ltd',
    sector: 'Banking',
    website: 'kotak.com',
    description:
      'Private bank and financial services group covering banking, asset management, and insurance.',
    basePrice: 1794.2,
    marketCap: 3560000000000,
  },
  {
    symbol: 'SUNPHARMA',
    companyName: 'Sun Pharmaceutical Industries Ltd',
    sector: 'Pharmaceuticals',
    website: 'sunpharma.com',
    description:
      'India’s largest pharma company, with specialty and generic medicines in India and global markets.',
    basePrice: 1816.9,
    marketCap: 4360000000000,
  },
  {
    symbol: 'TITAN',
    companyName: 'Titan Company Ltd',
    sector: 'Consumer Durables',
    website: 'titancompany.in',
    description:
      'Jewellery, watches, and eyewear retailer under Tanishq, Titan, and Fastrack brands.',
    basePrice: 3482.55,
    marketCap: 3090000000000,
  },
  {
    symbol: 'WIPRO',
    companyName: 'Wipro Ltd',
    sector: 'Information Technology',
    website: 'wipro.com',
    description:
      'IT services and consulting company offering digital, cloud, and engineering services worldwide.',
    basePrice: 268.4,
    marketCap: 2810000000000,
  },
  {
    symbol: 'ULTRACEMCO',
    companyName: 'UltraTech Cement Ltd',
    sector: 'Materials',
    website: 'ultratechcement.com',
    description:
      'India’s largest cement producer, supplying grey cement, white cement, and building products.',
    basePrice: 11462.0,
    marketCap: 3310000000000,
  },
  {
    symbol: 'NESTLEIND',
    companyName: 'Nestlé India Ltd',
    sector: 'FMCG',
    website: 'nestle.in',
    description:
      'Packaged foods company with brands across dairy, beverages, noodles, and confectionery.',
    basePrice: 2418.65,
    marketCap: 2330000000000,
  },
];

module.exports = { INDIAN_STOCKS };