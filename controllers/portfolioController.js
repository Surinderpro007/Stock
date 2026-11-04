const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Stock = require('../models/Stock');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');
const { ensureWallet } = require('../services/walletService');
const { roundMoney, roundPercent } = require('../lib/money');
const { httpError } = require('../lib/apiError');
const {
  applyBuy,
  applySell,
  tradeCost,
  roundShares,
  isLimitConditionMet,
} = require('../lib/tradeMath');
const { getLogoUrl } = require('../lib/stockLogo');
const { getMarketDataProvider } = require('../services/market');
const { getUsdInrRate } = require('../services/market/forexService');
const { getMarketStatus } = require('../lib/marketStatus');

function profitSummary(invested, currentValue) {
  const profitLossAmount = roundMoney(currentValue - invested);
  const profitLossPercent = invested > 0 ? roundPercent((profitLossAmount / invested) * 100) : 0;

  return { profitLossAmount, profitLossPercent };
}

async function withTransaction(work) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Executes a single trade against the wallet and holdings within a transaction session.
 * For US stocks (currency === 'USD'), calculates the exact INR equivalent using dynamic live forex.
 */
async function executeTradeInternal({ userId, stock, quantity, side, price, session }) {
  const isUsd = stock.currency === 'USD';
  let exchangeRate = 1;
  if (isUsd) {
    const forex = await getUsdInrRate();
    exchangeRate = forex.rate;
  }

  const wallet = await ensureWallet(userId, session);
  const holding = await Holding.findOne({ user: userId, stock: stock._id }).session(session);

  let result;
  if (side === 'buy') {
    result = applyBuy({
      balance: wallet.balance,
      quantity: holding?.quantity || 0,
      averageBuyPrice: holding?.averageBuyPrice || 0,
      buyQuantity: quantity,
      buyPrice: price,
      exchangeRate,
    });

    wallet.balance = result.balance;
    await wallet.save({ session });

    const totalInr = result.totalCash;

    if (!holding) {
      await Holding.create(
        [
          {
            user: userId,
            stock: stock._id,
            symbol: stock.symbol,
            quantity: result.quantity,
            averageBuyPrice: result.averageBuyPrice,
            currency: stock.currency || 'INR',
            totalInvestedInr: totalInr,
          },
        ],
        { session }
      );
    } else {
      holding.quantity = result.quantity;
      holding.averageBuyPrice = result.averageBuyPrice;
      holding.currency = stock.currency || 'INR';
      holding.totalInvestedInr = (holding.totalInvestedInr || 0) + totalInr;
      await holding.save({ session });
    }
  } else {
    result = applySell({
      balance: wallet.balance,
      quantity: holding?.quantity || 0,
      sellQuantity: quantity,
      sellPrice: price,
      exchangeRate,
    });

    wallet.balance = result.balance;
    await wallet.save({ session });

    const oldQuantity = holding?.quantity || quantity;
    holding.quantity = result.quantity;

    if (holding.quantity <= 0.00001) {
      await Holding.deleteOne({ _id: holding._id }).session(session);
    } else {
      const fractionRemaining = Math.max(0, holding.quantity / oldQuantity);
      holding.totalInvestedInr = roundMoney((holding.totalInvestedInr || 0) * fractionRemaining);
      await holding.save({ session });
    }
  }

  const total = result.total;
  const totalInr = result.totalCash;

  const [transaction] = await Transaction.create(
    [
      {
        user: userId,
        stock: stock._id,
        symbol: stock.symbol,
        type: side,
        quantity,
        price,
        total,
        currency: stock.currency || 'INR',
        exchangeRate: isUsd ? exchangeRate : undefined,
        totalInr,
      },
    ],
    { session }
  );

  return {
    side,
    type: side,
    symbol: stock.symbol,
    quantity,
    price,
    total,
    currency: stock.currency || 'INR',
    exchangeRate: isUsd ? exchangeRate : undefined,
    totalInr,
    balance: roundMoney(wallet.balance),
    transactionId: transaction._id,
  };
}

/**
 * Triggers all pending orders for a given stock when:
 *   1. The market for that stock is currently OPEN, AND
 *   2. The live price meets the order's limit condition (or it is a market-queued order).
 */
async function triggerPendingLimitOrdersForStock(stock) {
  if (!stock || typeof stock.currentPrice !== 'number') return [];

  // Only trigger when the relevant market is open
  const marketId = stock.currency === 'USD' ? 'US' : 'IN';
  const marketStatus = getMarketStatus(marketId);
  if (!marketStatus.isOpen) return [];

  const pendingOrders = await Order.find({
    symbol: stock.symbol,
    status: 'pending',
  }).sort({ createdAt: 1 });

  if (!pendingOrders.length) return [];

  const executedOrders = [];
  const isUsd = stock.currency === 'USD';
  let exchangeRate = 1;
  if (isUsd) {
    const forex = await getUsdInrRate();
    exchangeRate = forex.rate;
  }

  for (const order of pendingOrders) {
    // For market-type orders queued while closed: always execute at open
    // For limit orders: only execute when the price condition is met
    const shouldTrigger =
      order.orderType === 'market' ||
      isLimitConditionMet({
        side: order.side,
        currentPrice: stock.currentPrice,
        limitPrice: order.limitPrice,
      });

    if (!shouldTrigger) {
      continue;
    }

    try {
      await withTransaction(async (session) => {
        const freshOrder = await Order.findById(order._id).session(session);
        if (!freshOrder || freshOrder.status !== 'pending') return;

        const wallet = await ensureWallet(freshOrder.user, session);
        const holding = await Holding.findOne({
          user: freshOrder.user,
          stock: stock._id,
        }).session(session);

        if (freshOrder.side === 'buy') {
          const totalCostInr = roundMoney(freshOrder.quantity * stock.currentPrice * exchangeRate);
          if (wallet.balance < totalCostInr) {
            freshOrder.status = 'rejected';
            freshOrder.rejectionReason = 'Insufficient balance at trigger time';
            await freshOrder.save({ session });
            return;
          }
        } else {
          if (!holding || holding.quantity < freshOrder.quantity) {
            freshOrder.status = 'rejected';
            freshOrder.rejectionReason = 'Not enough shares owned at trigger time';
            await freshOrder.save({ session });
            return;
          }
        }

        const tradeResult = await executeTradeInternal({
          userId: freshOrder.user,
          stock,
          quantity: freshOrder.quantity,
          side: freshOrder.side,
          price: stock.currentPrice,
          session,
        });

        freshOrder.status = 'executed';
        freshOrder.executionPrice = stock.currentPrice;
        freshOrder.total = tradeResult.total;
        freshOrder.totalInr = tradeResult.totalInr;
        freshOrder.exchangeRate = exchangeRate;
        freshOrder.executedAt = new Date();
        await freshOrder.save({ session });

        executedOrders.push(freshOrder);
      });
    } catch (err) {
      console.warn(`Failed to execute pending order ${order._id}:`, err.message);
    }
  }

  return executedOrders;
}

/**
 * Monitors and executes any pending limit orders across all stocks using current quotes.
 */
async function triggerAllPendingLimitOrders() {
  await connectDB();
  const pendingSymbols = await Order.distinct('symbol', { status: 'pending' });
  if (!pendingSymbols.length) return [];

  const stocks = await Stock.find({ symbol: { $in: pendingSymbols } }).lean();
  let totalTriggered = [];

  for (const stock of stocks) {
    const executed = await triggerPendingLimitOrdersForStock(stock);
    totalTriggered = totalTriggered.concat(executed);
  }

  return totalTriggered;
}

/**
 * Main Order Placement Handler:
 * - Market Orders: executes immediately at live currentPrice.
 * - Limit Orders:
 *   - If current market price already satisfies the limit condition, executes immediately!
 *   - If condition not yet met, stores order with status 'pending' to execute when price arrives.
 */
async function placeOrder({
  userId,
  symbol,
  quantity,
  side,
  orderType = 'market',
  limitPrice,
}) {
  await connectDB();
  const normalizedSymbol = String(symbol).toUpperCase();

  return withTransaction(async (session) => {
    const stock = await Stock.findOne({ symbol: normalizedSymbol }).session(session);

    if (!stock) {
      throw httpError('Stock not found', 404);
    }

    const isUsd = stock.currency === 'USD';

    // Whole number validation for Indian stocks
    if (!isUsd && !Number.isInteger(quantity)) {
      throw httpError('Quantity must be a whole number for Indian stocks', 400);
    }

    // For US stocks, round fractional shares to 6 decimals
    if (isUsd) {
      quantity = roundShares(quantity);
      if (quantity <= 0) {
        throw httpError('Quantity must be greater than 0', 400);
      }
    }

    let exchangeRate = 1;
    if (isUsd) {
      const forex = await getUsdInrRate();
      exchangeRate = forex.rate;
    }

    const currentPrice = stock.currentPrice;
    const wallet = await ensureWallet(userId, session);
    const holding = await Holding.findOne({ user: userId, stock: stock._id }).session(session);

    const isLimit = orderType === 'limit';
    const numLimitPrice = isLimit ? roundMoney(Number(limitPrice)) : null;

    if (isLimit && (!numLimitPrice || numLimitPrice <= 0)) {
      throw httpError('Limit price must be greater than 0', 400);
    }

    // Capital & holding pre-checks
    if (side === 'buy') {
      const evaluationPrice = isLimit ? numLimitPrice : currentPrice;
      const requiredCashInr = roundMoney(quantity * evaluationPrice * exchangeRate);
      if (roundMoney(wallet.balance) < requiredCashInr) {
        throw httpError('Insufficient balance', 400);
      }
    } else {
      // Sell validation: check owned shares minus currently pending sell orders
      const pendingSells = await Order.find({
        user: userId,
        stock: stock._id,
        side: 'sell',
        status: 'pending',
      }).session(session);
      const pendingQty = pendingSells.reduce((acc, o) => acc + o.quantity, 0);
      const availableQty = (holding?.quantity || 0) - pendingQty;

      if (availableQty < quantity) {
        throw httpError('Not enough shares to sell', 400);
      }
    }

    // ── Market Hours Gate ─────────────────────────────────────────────
    // Determine which exchange this stock belongs to and whether it is currently open.
    const marketId = isUsd ? 'US' : 'IN';
    const marketStatus = getMarketStatus(marketId);
    const marketIsOpen = marketStatus.isOpen;

    // Check if limit condition is already met (only relevant when market is open)
    const limitConditionMet = isLimit
      ? isLimitConditionMet({ side, currentPrice, limitPrice: numLimitPrice })
      : false;

    // Execute immediately ONLY when:
    //   1. Market is OPEN, AND
    //   2. It is a market order OR limit condition is already satisfied
    const shouldExecuteNow = marketIsOpen && (!isLimit || limitConditionMet);

    if (shouldExecuteNow) {
      // ── Immediate Execution ──────────────────────────────────────────
      const tradeResult = await executeTradeInternal({
        userId,
        stock,
        quantity,
        side,
        price: currentPrice,
        session,
      });

      const [order] = await Order.create(
        [
          {
            user: userId,
            stock: stock._id,
            symbol: stock.symbol,
            side,
            orderType,
            quantity,
            limitPrice: numLimitPrice,
            executionPrice: currentPrice,
            total: tradeResult.total,
            currency: stock.currency || 'INR',
            exchangeRate: isUsd ? exchangeRate : undefined,
            totalInr: tradeResult.totalInr,
            status: 'executed',
            executedAt: new Date(),
          },
        ],
        { session }
      );

      const priceStr = isUsd ? `$${currentPrice.toFixed(2)}` : `₹${currentPrice.toFixed(2)}`;
      const formattedQty = Number.isInteger(quantity) ? quantity : quantity.toFixed(4);
      const inrNote = isUsd
        ? ` (₹${tradeResult.totalInr.toFixed(2)} deducted at $1 = ₹${exchangeRate.toFixed(2)})`
        : '';

      return {
        status: 'executed',
        orderType,
        side,
        symbol: stock.symbol,
        quantity,
        price: currentPrice,
        currency: stock.currency || 'INR',
        total: tradeResult.total,
        totalInr: tradeResult.totalInr,
        balance: tradeResult.balance,
        orderId: order._id,
        transactionId: tradeResult.transactionId,
        message: `${side === 'buy' ? 'Bought' : 'Sold'} ${formattedQty} share(s) of ${stock.symbol} at ${priceStr} (${orderType} order)${inrNote}.`,
      };
    } else {
      // ── Pending Order ────────────────────────────────────────────────
      // Reaches here when:
      //   a) Market is CLOSED (any order type) — queued until next open
      //   b) Market is OPEN but limit condition not yet met — queued until price is hit

      // For a closed-market order the trigger price = current price (execute at market open).
      // For a limit order it is always the user-specified limit price.
      const triggerPrice = isLimit ? numLimitPrice : currentPrice;
      const effectiveOrderType = isLimit ? 'limit' : 'market';

      const pendingTotalUsdOrInr = tradeCost(quantity, triggerPrice);
      const pendingTotalInr = roundMoney(quantity * triggerPrice * exchangeRate);

      const [order] = await Order.create(
        [
          {
            user: userId,
            stock: stock._id,
            symbol: stock.symbol,
            side,
            orderType: effectiveOrderType,
            quantity,
            limitPrice: triggerPrice,
            total: pendingTotalUsdOrInr,
            currency: stock.currency || 'INR',
            exchangeRate: isUsd ? exchangeRate : undefined,
            totalInr: pendingTotalInr,
            status: 'pending',
          },
        ],
        { session }
      );

      const triggerPriceStr = isUsd
        ? `$${triggerPrice.toFixed(2)}`
        : `₹${triggerPrice.toFixed(2)}`;
      const currentPriceStr = isUsd
        ? `$${currentPrice.toFixed(2)}`
        : `₹${currentPrice.toFixed(2)}`;
      const formattedQty = Number.isInteger(quantity) ? quantity : quantity.toFixed(4);
      const exchangeName = isUsd ? 'NASDAQ' : 'NSE';

      const nextOpen = marketStatus.nextSessionStart
        ? new Date(marketStatus.nextSessionStart).toLocaleString('en-IN', {
            timeZone: isUsd ? 'America/New_York' : 'Asia/Kolkata',
            dateStyle: 'medium',
            timeStyle: 'short',
          })
        : 'next session';

      let message;
      if (!marketIsOpen && !isLimit) {
        // Market order placed while exchange is closed
        message =
          `${exchangeName} is currently closed. Your ${side.toUpperCase()} order for ` +
          `${formattedQty} share(s) of ${stock.symbol} is queued at ${currentPriceStr} ` +
          `and will execute when the market opens (${nextOpen}).`;
      } else if (!marketIsOpen && isLimit) {
        // Limit order placed while exchange is closed
        const targetText =
          side === 'buy' ? `at ${triggerPriceStr} or below` : `at ${triggerPriceStr} or above`;
        message =
          `${exchangeName} is currently closed. Your limit ${side.toUpperCase()} order for ` +
          `${formattedQty} share(s) of ${stock.symbol} is queued ${targetText} ` +
          `and will be checked when the market opens (${nextOpen}).`;
      } else {
        // Market open but limit condition not yet met
        const targetText =
          side === 'buy'
            ? `when market price reaches ${triggerPriceStr} or below (current: ${currentPriceStr})`
            : `when market price reaches ${triggerPriceStr} or above (current: ${currentPriceStr})`;
        message =
          `Limit ${side.toUpperCase()} order placed for ${formattedQty} share(s) of ` +
          `${stock.symbol} at ${triggerPriceStr}. It will execute automatically ${targetText}.`;
      }

      return {
        status: 'pending',
        orderType: effectiveOrderType,
        side,
        symbol: stock.symbol,
        quantity,
        limitPrice: triggerPrice,
        currentPrice,
        currency: stock.currency || 'INR',
        total: pendingTotalUsdOrInr,
        totalInr: pendingTotalInr,
        balance: roundMoney(wallet.balance),
        orderId: order._id,
        marketClosed: !marketIsOpen,
        nextSessionStart: marketStatus.nextSessionStart,
        message,
      };
    }
  });
}

async function buyStock(userId, symbol, quantity, options = {}) {
  const { orderType = 'market', limitPrice } =
    typeof options === 'object' && options !== null ? options : {};
  return placeOrder({
    userId,
    symbol,
    quantity,
    side: 'buy',
    orderType,
    limitPrice,
  });
}

async function sellStock(userId, symbol, quantity, options = {}) {
  const { orderType = 'market', limitPrice } =
    typeof options === 'object' && options !== null ? options : {};
  return placeOrder({
    userId,
    symbol,
    quantity,
    side: 'sell',
    orderType,
    limitPrice,
  });
}

async function getPortfolio(userId) {
  await connectDB();
  await getMarketDataProvider().ensureFreshAll();
  await triggerAllPendingLimitOrders();

  const [wallet, holdings, pendingOrders, forex] = await Promise.all([
    ensureWallet(userId),
    Holding.find({ user: userId, quantity: { $gt: 0 } })
      .populate('stock', 'symbol companyName currentPrice website currency market exchange')
      .lean(),
    Order.find({ user: userId, status: 'pending' })
      .populate('stock', 'symbol companyName currentPrice website currency market exchange')
      .sort({ createdAt: -1 })
      .lean(),
    getUsdInrRate(),
  ]);

  const liveUsdInrRate = forex.rate;

  let totalInvested = 0;
  let currentValue = 0;

  const rows = holdings.map((holding) => {
    const isUsd = holding.stock?.currency === 'USD' || holding.currency === 'USD';
    const currentPrice = holding.stock?.currentPrice ?? 0;
    const rate = isUsd ? liveUsdInrRate : 1;

    // Invested amount in INR: either saved totalInvestedInr, or averageBuyPrice * quantity * rate
    const invested = holding.totalInvestedInr && holding.totalInvestedInr > 0
      ? roundMoney(holding.totalInvestedInr)
      : roundMoney(holding.quantity * holding.averageBuyPrice * rate);

    // Current value in INR
    const value = roundMoney(holding.quantity * currentPrice * rate);
    const pnl = profitSummary(invested, value);

    totalInvested += invested;
    currentValue += value;

    return {
      symbol: holding.symbol,
      companyName: holding.stock?.companyName || holding.symbol,
      logoUrl: getLogoUrl(holding.stock?.website, holding.symbol),
      quantity: holding.quantity,
      averageBuyPrice: holding.averageBuyPrice,
      currentPrice,
      currency: isUsd ? 'USD' : 'INR',
      invested,
      currentValue: value,
      exchangeRate: isUsd ? liveUsdInrRate : undefined,
      ...pnl,
    };
  });

  totalInvested = roundMoney(totalInvested);
  currentValue = roundMoney(currentValue);

  const pendingRows = pendingOrders.map((order) => {
    const isUsd = order.stock?.currency === 'USD' || order.currency === 'USD';
    const rate = isUsd ? liveUsdInrRate : 1;
    const livePrice = order.stock?.currentPrice ?? order.limitPrice;
    const distance = livePrice - order.limitPrice;
    const distancePercent = order.limitPrice > 0 ? (distance / order.limitPrice) * 100 : 0;
    const totalInr = order.totalInr || roundMoney(order.total * rate);

    return {
      id: String(order._id),
      symbol: order.symbol,
      companyName: order.stock?.companyName || order.symbol,
      logoUrl: getLogoUrl(order.stock?.website, order.symbol),
      side: order.side,
      orderType: order.orderType,
      quantity: order.quantity,
      limitPrice: order.limitPrice,
      currentPrice: livePrice,
      currency: isUsd ? 'USD' : 'INR',
      total: order.total,
      totalInr,
      status: order.status,
      distance: roundMoney(distance),
      distancePercent: Number(distancePercent.toFixed(2)),
      placedAt: order.placedAt || order.createdAt,
    };
  });

  return {
    balance: roundMoney(wallet.balance),
    totalInvested,
    currentValue,
    forexRate: liveUsdInrRate,
    ...profitSummary(totalInvested, currentValue),
    holdings: rows,
    pendingOrders: pendingRows,
  };
}

async function getOrders(userId, { status, symbol } = {}) {
  await connectDB();
  await triggerAllPendingLimitOrders();

  const filter = { user: userId };
  if (status) filter.status = status;
  if (symbol) filter.symbol = String(symbol).toUpperCase();

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .populate('stock', 'companyName currentPrice website logoUrl currency market exchange')
    .lean();

  return orders.map((o) => ({
    id: o._id,
    symbol: o.symbol,
    companyName: o.stock?.companyName || o.symbol,
    logoUrl: o.stock?.logoUrl || getLogoUrl(o.stock?.website, o.symbol),
    side: o.side,
    orderType: o.orderType,
    quantity: o.quantity,
    limitPrice: o.limitPrice,
    executionPrice: o.executionPrice,
    currentPrice: o.stock?.currentPrice,
    currency: o.currency || o.stock?.currency || 'INR',
    total: o.total,
    totalInr: o.totalInr,
    exchangeRate: o.exchangeRate,
    status: o.status,
    placedAt: o.placedAt || o.createdAt,
    executedAt: o.executedAt,
    cancelledAt: o.cancelledAt,
    rejectionReason: o.rejectionReason,
  }));
}

async function cancelOrder(userId, orderId) {
  await connectDB();

  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw httpError('Order not found', 404);
  }

  if (order.status !== 'pending') {
    throw httpError(`Cannot cancel order with status "${order.status}"`, 400);
  }

  order.status = 'cancelled';
  order.cancelledAt = new Date();
  await order.save();

  return { message: 'Order cancelled successfully', orderId: order._id };
}

async function getTransactions(userId, { page = 1, limit = 20, type } = {}) {
  await connectDB();

  const filter = { user: userId };
  if (type) {
    filter.type = type;
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    Transaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Transaction.countDocuments(filter),
  ]);

  return {
    transactions: items.map((item) => ({
      id: item._id,
      date: item.createdAt,
      symbol: item.symbol,
      type: item.type,
      quantity: item.quantity,
      price: item.price,
      currency: item.currency || 'INR',
      total: item.total,
      totalInr: item.totalInr,
      exchangeRate: item.exchangeRate,
    })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

module.exports = {
  getPortfolio,
  buyStock,
  sellStock,
  placeOrder,
  getOrders,
  cancelOrder,
  triggerPendingLimitOrdersForStock,
  triggerAllPendingLimitOrders,
  getTransactions,
};