const connectDB = require('../config/db');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const { roundMoney } = require('../lib/money');

async function getMarketOverview() {
  await connectDB();

  const grouped = await Transaction.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        volume: { $sum: '$total' },
      },
    },
  ]);

  const byType = { buy: { count: 0, volume: 0 }, sell: { count: 0, volume: 0 } };
  for (const row of grouped) {
    if (row._id === 'buy' || row._id === 'sell') {
      byType[row._id] = {
        count: row.count,
        volume: roundMoney(row.volume),
      };
    }
  }

  const totalTrades = byType.buy.count + byType.sell.count;
  const totalVolume = roundMoney(byType.buy.volume + byType.sell.volume);
  const walletCount = await Wallet.countDocuments();

  const recent = await Transaction.find({})
    .sort({ createdAt: -1 })
    .limit(15)
    .select('symbol type quantity price total createdAt')
    .lean();

  return {
    totalTrades,
    totalVolume,
    walletCount,
    buys: byType.buy,
    sells: byType.sell,
    recent: recent.map((item) => ({
      id: item._id,
      date: item.createdAt,
      symbol: item.symbol,
      type: item.type,
      quantity: item.quantity,
      price: item.price,
      total: item.total,
    })),
  };
}

module.exports = {
  getMarketOverview,
};
