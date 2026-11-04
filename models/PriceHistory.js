const mongoose = require('mongoose');

const INTERVALS = ['intraday', 'daily'];

const priceHistorySchema = new mongoose.Schema(
  {
    stock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stock',
      required: true,
      index: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    interval: {
      type: String,
      required: true,
      enum: INTERVALS,
    },
  },
  { timestamps: false }
);

priceHistorySchema.index({ stock: 1, interval: 1, timestamp: 1 }, { unique: true });
priceHistorySchema.index({ symbol: 1, interval: 1, timestamp: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.PriceHistory) {
  delete mongoose.models.PriceHistory;
}

const PriceHistory =
  mongoose.models.PriceHistory || mongoose.model('PriceHistory', priceHistorySchema);

module.exports = PriceHistory;
module.exports.INTERVALS = INTERVALS;
