const { test } = require('node:test');
const assert = require('node:assert/strict');
const { applyBuy, applySell, tradeCost, nextAverageBuyPrice } = require('../lib/tradeMath');
const { roundMoney } = require('../lib/money');

test('buy deducts cash and sets average price on first purchase', () => {
  const result = applyBuy({
    balance: 10000,
    quantity: 0,
    averageBuyPrice: 0,
    buyQuantity: 2,
    buyPrice: 1500,
  });

  assert.equal(result.total, 3000);
  assert.equal(result.balance, 7000);
  assert.equal(result.quantity, 2);
  assert.equal(result.averageBuyPrice, 1500);
});

test('buy rejects insufficient balance', () => {
  assert.throws(
    () =>
      applyBuy({
        balance: 100,
        quantity: 0,
        buyQuantity: 1,
        buyPrice: 1500,
      }),
    (error) => error.message === 'Insufficient balance' && error.status === 400
  );
});

test('second buy averages the purchase price', () => {
  const average = nextAverageBuyPrice({
    quantity: 2,
    averageBuyPrice: 100,
    buyQuantity: 2,
    buyPrice: 200,
  });

  assert.equal(average, 150);
});

test('sell credits the wallet and reduces quantity', () => {
  const result = applySell({
    balance: 7000,
    quantity: 5,
    sellQuantity: 2,
    sellPrice: 400,
  });

  assert.equal(result.total, 800);
  assert.equal(result.balance, 7800);
  assert.equal(result.quantity, 3);
});

test('sell rejects when the user does not own enough shares', () => {
  assert.throws(
    () =>
      applySell({
        balance: 10000,
        quantity: 1,
        sellQuantity: 2,
        sellPrice: 100,
      }),
    (error) => error.message === 'Not enough shares to sell' && error.status === 400
  );
});

test('trade cost rounds to paise', () => {
  assert.equal(tradeCost(3, 10.555), roundMoney(31.67));
});
