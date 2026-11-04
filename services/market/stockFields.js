const { roundMoney } = require('../../lib/money');
const { getLogoUrl } = require('../../lib/stockLogo');

/** Fields every visitor (including guests) may see. */
function publicStockFields(stock) {
  const result = {
    symbol: stock.symbol,
    companyName: stock.companyName,
    currentPrice: stock.currentPrice,
  };

  if (stock.website || stock.logoUrl) {
    result.logoUrl = getLogoUrl(stock.website, stock.symbol);
  }

  return result;
}

/** Fields for full stock detail views. */
function detailStockFields(stock) {
  const changeAmount = roundMoney(stock.currentPrice - stock.previousClose);
  const changePercent = stock.previousClose
    ? roundMoney((changeAmount / stock.previousClose) * 100)
    : 0;

  return {
    symbol: stock.symbol,
    companyName: stock.companyName,
    sector: stock.sector,
    market: stock.market || 'IN',
    exchange: stock.exchange || (stock.market === 'US' ? 'NASDAQ' : 'NSE'),
    currency: stock.currency || (stock.market === 'US' ? 'USD' : 'INR'),
    description: stock.description,
    logoUrl: getLogoUrl(stock.website, stock.symbol),
    currentPrice: stock.currentPrice,
    previousClose: stock.previousClose,
    openPrice: stock.openPrice || stock.previousClose,
    dayHigh: stock.dayHigh,
    dayLow: stock.dayLow,
    marketCap: stock.marketCap,
    week52High: stock.week52High,
    week52Low: stock.week52Low,
    volume: stock.volume || 0,
    priceTime: stock.priceTime,
    quoteUpdatedAt: stock.quoteUpdatedAt,
    changeAmount,
    changePercent,
  };
}

module.exports = {
  publicStockFields,
  detailStockFields,
};
