const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const Holding = require('../models/Holding');
const { STARTING_BALANCE, CURRENCY } = require('../config/trading');
const { roundMoney } = require('../lib/money');
const { httpError } = require('../lib/apiError');

async function ensureWallet(userId, session = null) {
  const query = Wallet.findOne({ user: userId });
  if (session) {
    query.session(session);
  }

  let wallet = await query;

  if (wallet) {
    return wallet;
  }

  const payload = {
    user: userId,
    balance: roundMoney(STARTING_BALANCE),
  };

  try {
    const created = await Wallet.create([payload], session ? { session } : undefined);
    return Array.isArray(created) ? created[0] : created;
  } catch (error) {
    if (error.code === 11000) {
      const existing = Wallet.findOne({ user: userId });
      if (session) {
        existing.session(session);
      }
      return existing;
    }
    throw error;
  }
}

async function ensureWalletsForAllUsers(userIds) {
  let created = 0;

  for (const userId of userIds) {
    const before = await Wallet.exists({ user: userId });
    await ensureWallet(userId);
    if (!before) {
      created += 1;
    }
  }

  return created;
}

async function getWalletDetails(userId) {
  const wallet = await ensureWallet(userId);

  // Get transaction stats
  const transactions = await Transaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  let totalTrades = transactions.length;
  let cashOutflow = 0; // Money spent buying stocks
  let cashInflow = 0;  // Money gained from selling stocks

  for (const tx of transactions) {
    if (tx.type === 'buy') {
      cashOutflow += tx.total;
    } else if (tx.type === 'sell') {
      cashInflow += tx.total;
    }
  }

  // Get active holdings to see cash currently committed in active positions
  const holdings = await Holding.find({ user: userId, quantity: { $gt: 0 } }).lean();
  let totalCommitted = 0;
  for (const h of holdings) {
    totalCommitted += h.totalInvestedInr && h.totalInvestedInr > 0
      ? h.totalInvestedInr
      : (h.quantity * h.averageBuyPrice);
  }

  const recentTransactions = transactions.slice(0, 10).map((tx) => ({
    id: tx._id,
    date: tx.createdAt,
    symbol: tx.symbol,
    type: tx.type,
    quantity: tx.quantity,
    price: tx.price,
    currency: tx.currency || 'INR',
    total: tx.total,
    totalInr: tx.totalInr,
    exchangeRate: tx.exchangeRate,
  }));

  return {
    balance: roundMoney(wallet.balance),
    startingBalance: roundMoney(STARTING_BALANCE),
    currency: CURRENCY,
    totalTrades,
    cashInflow: roundMoney(cashInflow),
    cashOutflow: roundMoney(cashOutflow),
    totalCommitted: roundMoney(totalCommitted),
    recentTransactions,
  };
}

async function addFunds(userId, amount) {
  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    throw httpError('Amount must be a positive number', 400);
  }
  if (numAmount > 1000000) {
    throw httpError('Maximum deposit amount per transaction is ₹1,000,000', 400);
  }

  const wallet = await ensureWallet(userId);
  wallet.balance = roundMoney(wallet.balance + numAmount);
  await wallet.save();

  return getWalletDetails(userId);
}

async function resetWallet(userId) {
  const wallet = await ensureWallet(userId);
  wallet.balance = roundMoney(STARTING_BALANCE);
  await wallet.save();

  return getWalletDetails(userId);
}

module.exports = {
  ensureWallet,
  ensureWalletsForAllUsers,
  getWalletDetails,
  addFunds,
  resetWallet,
};
