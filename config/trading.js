const STARTING_BALANCE = Number(process.env.STARTING_BALANCE || 10000);

// "yahoo" = real NSE prices (default). "simulated" = offline random-walk data for development.
const MARKET_DATA_PROVIDER = process.env.MARKET_DATA_PROVIDER || 'yahoo';

// Only used by the simulated provider.
const TICK_MAX_PERCENT = Number(process.env.TICK_MAX_PERCENT || 0.4);

// How long a stored quote is considered fresh before it is re-fetched from the live feed.
const QUOTE_TTL_SECONDS = Math.max(5, Number(process.env.QUOTE_TTL_SECONDS || 30));

const CURRENCY = process.env.CURRENCY || 'INR';

module.exports = {
  STARTING_BALANCE,
  MARKET_DATA_PROVIDER,
  TICK_MAX_PERCENT,
  QUOTE_TTL_SECONDS,
  CURRENCY,
};