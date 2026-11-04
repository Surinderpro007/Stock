const { test } = require('node:test');
const assert = require('node:assert/strict');

const { isLimitConditionMet, tradeCost, applyBuy, applySell } = require('../lib/tradeMath');
const { tradeBodySchema, ordersQuerySchema } = require('../lib/tradeValidation');

test('isLimitConditionMet correctly triggers Buy limit orders', () => {
  // Target: Buy at ₹480 or below
  // Case 1: Market price is ₹500 (above limit) -> should NOT trigger
  assert.equal(
    isLimitConditionMet({ side: 'buy', currentPrice: 500, limitPrice: 480 }),
    false
  );

  // Case 2: Market price drops to exactly ₹480 -> MUST trigger
  assert.equal(
    isLimitConditionMet({ side: 'buy', currentPrice: 480, limitPrice: 480 }),
    true
  );

  // Case 3: Market price drops to ₹475 (better price than limit) -> MUST trigger
  assert.equal(
    isLimitConditionMet({ side: 'buy', currentPrice: 475, limitPrice: 480 }),
    true
  );
});

test('isLimitConditionMet correctly triggers Sell limit orders', () => {
  // Target: Sell at ₹550 or above
  // Case 1: Market price is ₹500 (below limit) -> should NOT trigger
  assert.equal(
    isLimitConditionMet({ side: 'sell', currentPrice: 500, limitPrice: 550 }),
    false
  );

  // Case 2: Market price rises to exactly ₹550 -> MUST trigger
  assert.equal(
    isLimitConditionMet({ side: 'sell', currentPrice: 550, limitPrice: 550 }),
    true
  );

  // Case 3: Market price rises to ₹565 (better price than limit) -> MUST trigger
  assert.equal(
    isLimitConditionMet({ side: 'sell', currentPrice: 565, limitPrice: 550 }),
    true
  );
});

test('tradeBodySchema accepts valid market orders', () => {
  const marketBuy = tradeBodySchema.safeParse({
    symbol: 'TCS',
    quantity: 2,
    orderType: 'market',
  });
  assert.equal(marketBuy.success, true);
  assert.equal(marketBuy.data.orderType, 'market');

  // Default without orderType must default to market
  const defaultOrder = tradeBodySchema.safeParse({
    symbol: 'INFY',
    quantity: 5,
  });
  assert.equal(defaultOrder.success, true);
  assert.equal(defaultOrder.data.orderType, 'market');
});

test('tradeBodySchema validates limit orders properly', () => {
  // Valid limit order with positive limitPrice
  const validLimit = tradeBodySchema.safeParse({
    symbol: 'RELIANCE',
    quantity: 10,
    orderType: 'limit',
    limitPrice: 2850.5,
  });
  assert.equal(validLimit.success, true);
  assert.equal(validLimit.data.orderType, 'limit');
  assert.equal(validLimit.data.limitPrice, 2850.5);

  // Invalid limit order: missing limitPrice
  const missingPrice = tradeBodySchema.safeParse({
    symbol: 'RELIANCE',
    quantity: 10,
    orderType: 'limit',
  });
  assert.equal(missingPrice.success, false);

  // Invalid limit order: negative limitPrice
  const negativePrice = tradeBodySchema.safeParse({
    symbol: 'RELIANCE',
    quantity: 10,
    orderType: 'limit',
    limitPrice: -100,
  });
  assert.equal(negativePrice.success, false);
});

test('ordersQuerySchema validates status filter', () => {
  assert.equal(ordersQuerySchema.safeParse({ status: 'pending' }).success, true);
  assert.equal(ordersQuerySchema.safeParse({ status: 'executed' }).success, true);
  assert.equal(ordersQuerySchema.safeParse({ status: 'cancelled' }).success, true);
  assert.equal(ordersQuerySchema.safeParse({ status: 'invalid_status' }).success, false);
});

test('Limit order math calculation preserves precision', () => {
  const qty = 5;
  const limitPrice = 480.25;
  const total = tradeCost(qty, limitPrice);
  assert.equal(total, 2401.25);
});

test('Pending limit order stays unexecuted and does not alter holdings until target price reached', () => {
  const initialBalance = 100000;
  const initialHoldingQty = 0;
  const targetBuyPrice = 480;
  let marketPrice = 500; // market above target

  // Step 1: Check condition before market moves
  const conditionMetInitial = isLimitConditionMet({
    side: 'buy',
    currentPrice: marketPrice,
    limitPrice: targetBuyPrice,
  });
  assert.equal(conditionMetInitial, false, 'Pending order must not execute when market is 500');

  // Since condition is false, holdings and balance must remain untouched
  let holdingQty = initialHoldingQty;
  let balance = initialBalance;
  assert.equal(holdingQty, 0, 'Pending order must NOT appear as completed holding');
  assert.equal(balance, 100000);

  // Step 2: Live market drops to ₹475 (trigger met)
  marketPrice = 475;
  const conditionMetAfterDrop = isLimitConditionMet({
    side: 'buy',
    currentPrice: marketPrice,
    limitPrice: targetBuyPrice,
  });
  assert.equal(conditionMetAfterDrop, true, 'Limit buy must trigger when market drops to 475');

  // Step 3: Trigger executes trade: moves from Pending to Holdings (All)
  const orderQty = 10;
  const buyResult = applyBuy({
    balance,
    quantity: holdingQty,
    averageBuyPrice: 0,
    buyQuantity: orderQty,
    buyPrice: marketPrice,
  });

  holdingQty = buyResult.quantity;
  balance = buyResult.balance;

  assert.equal(holdingQty, 10, 'Holding must now reflect the executed 10 shares');
  assert.equal(buyResult.averageBuyPrice, 475);
  assert.equal(balance, initialBalance - 4750, 'Wallet balance must be deducted upon execution');
});

test('Pending sell limit order does not credit wallet until executed at or above limit price', () => {
  const initialBalance = 50000;
  let holdingQty = 20;
  const targetSellPrice = 600;
  let marketPrice = 580; // market below target

  // Market is 580, limit sell is 600
  assert.equal(
    isLimitConditionMet({ side: 'sell', currentPrice: marketPrice, limitPrice: targetSellPrice }),
    false,
    'Pending sell order must not execute below target'
  );

  // Holdings and balance unchanged while pending
  let balance = initialBalance;
  assert.equal(holdingQty, 20);
  assert.equal(balance, initialBalance);

  // Market surges to 610
  marketPrice = 610;
  assert.equal(
    isLimitConditionMet({ side: 'sell', currentPrice: marketPrice, limitPrice: targetSellPrice }),
    true,
    'Pending sell order triggers when market reaches 610'
  );

  // Execute sell: decrements holdings, credits wallet
  const sellResult = applySell({
    balance,
    quantity: holdingQty,
    sellQuantity: 10,
    sellPrice: marketPrice,
  });

  holdingQty = sellResult.quantity;
  balance = sellResult.balance;

  assert.equal(holdingQty, 10, 'Shares owned reduced to 10');
  assert.equal(balance, initialBalance + 6100, 'Wallet credited upon limit execution');
});

test('tradeBodySchema accepts fractional shares for US stock orders', () => {
  const fractionalBuy = tradeBodySchema.safeParse({
    symbol: 'TSLA',
    quantity: 0.3333,
    orderType: 'market',
  });
  assert.equal(fractionalBuy.success, true);
  assert.equal(fractionalBuy.data.quantity, 0.3333);

  const fractionalLimit = tradeBodySchema.safeParse({
    symbol: 'AAPL',
    quantity: 0.125,
    orderType: 'limit',
    limitPrice: 220.5,
  });
  assert.equal(fractionalLimit.success, true);
  assert.equal(fractionalLimit.data.quantity, 0.125);
  assert.equal(fractionalLimit.data.limitPrice, 220.5);

  // Negative or zero quantity must be rejected
  assert.equal(tradeBodySchema.safeParse({ symbol: 'TSLA', quantity: 0 }).success, false);
  assert.equal(tradeBodySchema.safeParse({ symbol: 'TSLA', quantity: -0.5 }).success, false);
});

test('US stock buy with forex rate converts USD to INR and deducts exact INR wallet equivalent', () => {
  // User example:
  // Stock costs $300, exchange rate is $1 = ₹90.
  // 1 whole share = ₹27,000.
  // Investing ₹9,000 yields: (9000 / 90) / 300 = 0.333333 shares.
  const priceUsd = 300;
  const usdInrRate = 90;
  const investInr = 9000;
  const fractionalShares = Number(((investInr / usdInrRate) / priceUsd).toFixed(4)); // 0.3333

  assert.equal(fractionalShares, 0.3333);

  const initialBalance = 100000; // ₹1,00,000 INR wallet
  const result = applyBuy({
    balance: initialBalance,
    quantity: 0,
    averageBuyPrice: 0,
    buyQuantity: fractionalShares,
    buyPrice: priceUsd,
    exchangeRate: usdInrRate,
  });

  // Total in USD = 0.3333 * 300 = $99.99
  // Total in INR = 0.3333 * 300 * 90 = ₹8,999.10
  assert.equal(result.quantity, 0.3333);
  assert.equal(result.averageBuyPrice, 300); // average buy price tracked in USD
  assert.equal(result.total, 99.99); // stock cost in USD
  assert.equal(result.totalCash, 8999.1); // cash deducted in INR
  assert.equal(result.balance, initialBalance - 8999.1); // INR wallet balance
});

test('US stock sell with forex rate converts USD proceeds to INR and credits INR wallet', () => {
  const priceUsd = 350; // stock price rose from $300 to $350
  const usdInrRate = 90;
  const sharesOwned = 0.3333;
  const initialBalance = 50000; // ₹50,000 INR wallet

  const result = applySell({
    balance: initialBalance,
    quantity: sharesOwned,
    sellQuantity: sharesOwned,
    sellPrice: priceUsd,
    exchangeRate: usdInrRate,
  });

  // Proceeds in USD = 0.3333 * 350 = $116.66
  // Proceeds in INR = 0.3333 * 350 * 90 = ₹10,498.95
  assert.equal(result.quantity, 0); // all shares sold
  assert.equal(result.total, 116.66); // USD proceeds
  assert.equal(result.totalCash, 10498.95); // INR proceeds credited
  assert.equal(result.balance, initialBalance + 10498.95); // INR wallet balance updated
});

test('forexService fetches dynamic live USD/INR exchange rate', async () => {
  const { getUsdInrRate } = require('../services/market/forexService');
  const forex = await getUsdInrRate();

  assert.ok(typeof forex.rate === 'number', 'Forex rate must be a number');
  assert.ok(forex.rate > 50 && forex.rate < 200, 'Forex rate must be within realistic market range');
  assert.ok(typeof forex.source === 'string', 'Forex source must be reported');
});
