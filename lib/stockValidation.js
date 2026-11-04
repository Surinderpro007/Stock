const { z } = require('zod');
const { RANGE_KEYS } = require('../services/market/ranges');

const listStocksQuerySchema = z.object({
  q: z.string().trim().max(50).optional().default(''),
  category: z.string().trim().max(50).optional().default(''),
  market: z.enum(['IN', 'US', 'all', 'in', 'us', 'ALL', '']).optional().default(''),
  sortBy: z.enum(['symbol', 'name', 'price', 'change']).optional().default('symbol'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

const historyQuerySchema = z.object({
  range: z.enum(RANGE_KEYS).optional().default('1m'),
});

const symbolParamSchema = z
  .string()
  .trim()
  .min(1, 'Symbol is required')
  .max(20)
  .regex(/^[A-Za-z0-9.-]+$/, 'Invalid stock symbol');

function formatZodError(error) {
  return error.issues?.[0]?.message || error.errors?.[0]?.message || 'Invalid input';
}

module.exports = {
  listStocksQuerySchema,
  historyQuerySchema,
  symbolParamSchema,
  RANGE_KEYS,
  formatZodError,
};
