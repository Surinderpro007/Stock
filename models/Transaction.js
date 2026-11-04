const mongoose = require('mongoose');

const TRANSACTION_TYPES = ['buy', 'sell'];

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stock: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Stock',
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: TRANSACTION_TYPES,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.0001, 'Quantity must be greater than 0'],
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'Total cannot be negative'],
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR',
    },
    exchangeRate: {
      type: Number,
      min: [0, 'Exchange rate cannot be negative'],
    },
    totalInr: {
      type: Number,
      min: [0, 'Total INR cannot be negative'],
    },
  },
  { timestamps: true }
);

transactionSchema.index({ user: 1, createdAt: -1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.Transaction) {
  delete mongoose.models.Transaction;
}

const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
module.exports.TRANSACTION_TYPES = TRANSACTION_TYPES;
