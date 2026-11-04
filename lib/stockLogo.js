/**
 * Builds company logo URLs from the company's website domain.
 *
 * Logo service priority (fallback chain managed in StockLogo.tsx):
 *   1. Direct company favicon  — https://{domain}/favicon.ico
 *   2. Google favicon service  — www.google.com/s2/favicons (broad coverage)
 *   3. Local /logos/*.svg      — bundled placeholder (Indian stocks only)
 *   4. Company initials        — always works
 *
 * Note: Clearbit (logo.clearbit.com) has been discontinued — DNS NXDOMAIN.
 * Note: DuckDuckGo (icons.duckduckgo.com) may not resolve in all networks.
 */

/**
 * Well-known domain overrides for stocks whose seed `website` field
 * is not the best domain for favicon lookup.
 *
 * Keys are lowercase stock symbols (NSE or US).
 */
const SYMBOL_LOGO_DOMAIN_OVERRIDE = {
  // Indian stocks
  tcs: 'tcs.com',                      // Use official TCS domain
  titan: 'tanishq.co.in',              // Titan's consumer brand domain
  bajfinance: 'bajajfinserv.in',        // Bajaj FinServ parent domain
  nestleind: 'nestle.in',              // Nestle India
  bhartiartl: 'airtel.in',             // Bharti Airtel / Airtel
  sbin: 'sbi.co.in',                   // State Bank of India
  // US stocks — ensure correct consumer-facing domains
  googl: 'google.com',                 // abc.xyz → google.com (better favicon)
  jpm: 'jpmorganchase.com',           // JP Morgan Chase
  jnj: 'jnj.com',                     // Johnson & Johnson
  wmt: 'walmart.com',                  // Walmart
  nflx: 'netflix.com',                 // Netflix
  v: 'visa.com',                       // Visa
};

function normalizeDomain(website) {
  if (typeof website !== 'string') return '';
  return website
    .trim()
    .toLowerCase()
    .replace(/^[a-z][a-z0-9+.-]*:\/\//, '')
    .replace(/^www\./, '')
    .split(/[/?#]/)[0];
}

/**
 * Returns the primary logo URL (direct company favicon) for a given stock.
 * StockLogo.tsx adds Google favicon and local SVG as automatic fallbacks.
 *
 * @param {string} website  - Company website URL or domain (e.g. "apple.com")
 * @param {string} symbol   - Stock symbol (e.g. "AAPL", "TCS")
 * @returns {string|null}   - Primary logo URL, or null if domain cannot be determined
 */
function getLogoUrl(website, symbol) {
  let site = typeof website === 'string' ? website : '';
  const sym = typeof symbol === 'string' ? symbol.trim().toLowerCase() : '';

  // Apply per-symbol domain override when available
  if (sym && SYMBOL_LOGO_DOMAIN_OVERRIDE[sym]) {
    site = SYMBOL_LOGO_DOMAIN_OVERRIDE[sym];
  }

  const domain = normalizeDomain(site);

  if (domain && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
    // Direct company favicon — most reliable, no third-party dependency
    return `https://${domain}/favicon.ico`;
  }

  return null;
}

module.exports = {
  SYMBOL_LOGO_DOMAIN_OVERRIDE,
  normalizeDomain,
  getLogoUrl,
};
