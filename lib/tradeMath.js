const { roundMoney } = require('./money');
const { httpError } = require('./apiError');

function roundShares(qty) {
  return Number(Number(qty).toFixed(6));
}

function tradeCost(quantity, price) {
  return roundMoney(Number(quantity) * Number(price));
}

function assertCanBuy(balance, total) {
  if (roundMoney(balance) < roundMoney(total)) {
    throw httpError('Insufficient balance', 400);
  }
}

function assertCanSell(ownedQuantity, sellQuantity) {
  if (!ownedQuantity || ownedQuantity < sellQuantity) {
    throw httpError('Not enough shares to sell', 400);
  }
}

function nextAverageBuyPrice({ quantity, averageBuyPrice, buyQuantity, buyPrice }) {
  if (!quantity || quantity <= 0) {
    return roundMoney(buyPrice);
  }

  const newQuantity = quantity + buyQuantity;
  if (newQuantity <= 0) return 0;
  return roundMoney((quantity * averageBuyPrice + buyQuantity * buyPrice) / newQuantity);
}

function applyBuy({ balance, quantity = 0, averageBuyPrice = 0, buyQuantity, buyPrice, exchangeRate = 1 }) {
  const stockTotal = tradeCost(buyQuantity, buyPrice);
  const cashTotal = roundMoney(buyQuantity * buyPrice * (exchangeRate || 1));
  assertCanBuy(balance, cashTotal);

  return {
    balance: roundMoney(balance - cashTotal),
    quantity: roundShares(quantity + buyQuantity),
    averageBuyPrice: nextAverageBuyPrice({
      quantity,
      averageBuyPrice,
      buyQuantity,
      buyPrice,
    }),
    total: stockTotal,
    totalCash: cashTotal,
  };
}

function applySell({ balance, quantity, sellQuantity, sellPrice, exchangeRate = 1 }) {
  assertCanSell(quantity, sellQuantity);
  const stockTotal = tradeCost(sellQuantity, sellPrice);
  const cashTotal = roundMoney(sellQuantity * sellPrice * (exchangeRate || 1));

  return {
    balance: roundMoney(balance + cashTotal),
    quantity: roundShares(quantity - sellQuantity),
    total: stockTotal,
    totalCash: cashTotal,
  };
}

/**
 * Checks whether a limit order's price threshold has been crossed by the live market price.
 * - Limit Buy: triggers when live market price <= limit price.
 * - Limit Sell: triggers when live market price >= limit price.
 */
function isLimitConditionMet({ side, currentPrice, limitPrice }) {
  if (typeof currentPrice !== 'number' || typeof limitPrice !== 'number') {
    return false;
  }
  if (side === 'buy') {
    return currentPrice <= limitPrice;
  }
  if (side === 'sell') {
    return currentPrice >= limitPrice;
  }
  return false;
}

module.exports = {
  roundShares,
  tradeCost,
  assertCanBuy,
  assertCanSell,
  nextAverageBuyPrice,
  applyBuy,
  applySell,
  isLimitConditionMet,
};
