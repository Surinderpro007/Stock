const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema(
  {
    symbol: {
      type: String,
      required: [true, 'Symbol is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    sector: {
      type: String,
      required: [true, 'Sector is required'],
      trim: true,
    },
    market: {
      type: String,
      enum: ['IN', 'US'],
      default: 'IN',
      index: true,
    },
    exchange: {
      type: String,
      trim: true,
      default: 'NSE',
    },
    currency: {
      type: String,
      enum: ['INR', 'USD'],
      default: 'INR',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    currentPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    previousClose: {
      type: Number,
      required: true,
      min: 0,
    },
    openPrice: {
      type: Number,
      min: 0,
    },
    dayHigh: {
      type: Number,
      required: true,
      min: 0,
    },
    dayLow: {
      type: Number,
      required: true,
      min: 0,
    },
    marketCap: {
      type: Number,
      required: true,
      min: 0,
    },
    week52High: {
      type: Number,
      required: true,
      min: 0,
    },
    week52Low: {
      type: Number,
      required: true,
      min: 0,
    },
    volume: {
      type: Number,
      min: 0,
      default: 0,
    },
    // Company website domain (e.g. "tcs.com"). The logo URL is derived from it.
    website: {
      type: String,
      trim: true,
      lowercase: true,
    },
    logoUrl: {
      type: String,
      trim: true,
    },
    // When the exchange last traded this price.
    priceTime: {
      type: Date,
    },
    // When we last refreshed the quote from the market feed.
    quoteUpdatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

stockSchema.index({ companyName: 1 });
stockSchema.index({ sector: 1 });

if (process.env.NODE_ENV !== 'production' && mongoose.models.Stock) {
  delete mongoose.models.Stock;
}

const Stock = mongoose.models.Stock || mongoose.model('Stock', stockSchema);

module.exports = Stock;
