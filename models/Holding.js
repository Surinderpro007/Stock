const mongoose = require('mongoose');

const holdingSchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Quantity cannot be negative'],
    },
    averageBuyPrice: {
      type: Number,
      required: true,
      min: [0, 'Average buy price cannot be negative'],
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR',
    },
    totalInvestedInr: {
      type: Number,
      min: [0, 'Invested INR cannot be negative'],
      default: 0,
    },
  },
  { timestamps: true }
);

holdingSchema.index({ user: 1, stock: 1 }, { unique: true });

if (process.env.NODE_ENV !== 'production' && mongoose.models.Holding) {
  delete mongoose.models.Holding;
}

const Holding = mongoose.models.Holding || mongoose.model('Holding', holdingSchema);

module.exports = Holding;
