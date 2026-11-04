const { MARKET_DATA_PROVIDER } = require('../../config/trading');
const simulatedProvider = require('./simulatedProvider');
const yahooProvider = require('./yahooProvider');

/**
 * Every provider exposes the same functions:
 *   getQuote(symbol)            -> detail fields or null
 *   getHistory(symbol, range)   -> chart payload or null
 *   ensureFresh(symbol)         -> refresh one stored quote if stale (never throws)
 *   ensureFreshAll()            -> refresh all stored quotes if stale (never throws)
 *   refresh()                   -> force a refresh (used by the cron route)
 *   publicStockFields / detailStockFields
 */
const providers = {
  yahoo: yahooProvider,
  simulated: simulatedProvider,
};

function getMarketDataProvider() {
  const key = String(MARKET_DATA_PROVIDER || 'yahoo').toLowerCase();
  return providers[key] || providers.yahoo;
}

module.exports = {
  getMarketDataProvider,
};