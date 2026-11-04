const mongoose = require('mongoose');

const ORDER_SIDES = ['buy', 'sell'];
const ORDER_TYPES = ['market', 'limit'];
const ORDER_STATUSES = ['pending', 'executed', 'cancelled', 'rejected'];

const orderSchema = new mongoose.Schema(
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
      index: true,
    },
    side: {
      type: String,
      required: true,
      enum: ORDER_SIDES,
    },
    orderType: {
      type: String,
      required: true,
      enum: ORDER_TYPES,
      default: 'market',
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.0001, 'Quantity must be greater than 0'],
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
    limitPrice: {
      type: Number,
      min: [0, 'Limit price cannot be negative'],
    },
    executionPrice: {
      type: Number,
      min: [0, 'Execution price cannot be negative'],
    },
    total: {
      type: Number,
      min: [0, 'Total cannot be negative'],
    },
    status: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
      default: 'pending',
      index: true,
    },
    placedAt: {
      type: Date,
      default: Date.now,
    },
    executedAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, status: 1, createdAt: -1 });
orderSchema.index({ status: 1, symbol: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.Order) {
  delete mongoose.models.Order;
}

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);
