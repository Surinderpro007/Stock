const { z } = require('zod');

const tradeBodySchema = z
  .object({
    symbol: z
      .string()
      .trim()
      .min(1, 'Symbol is required')
      .max(20)
      .regex(/^[A-Za-z0-9.-]+$/, 'Invalid stock symbol'),
    quantity: z.coerce
      .number({ error: 'Quantity is required' })
      .positive('Quantity must be greater than 0')
      .max(100000, 'Quantity is too large'),
    orderType: z.enum(['market', 'limit']).optional().default('market'),
    limitPrice: z.coerce
      .number()
      .positive('Limit price must be greater than 0')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.orderType === 'limit') {
        return typeof data.limitPrice === 'number' && data.limitPrice > 0;
      }
      return true;
    },
    {
      message: 'Limit price is required for limit orders',
      path: ['limitPrice'],
    }
  );

const transactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  type: z.enum(['buy', 'sell']).optional(),
});

const ordersQuerySchema = z.object({
  status: z.enum(['pending', 'executed', 'cancelled', 'rejected']).optional(),
  symbol: z.string().trim().toUpperCase().optional(),
});

function formatZodError(error) {
  return error.issues?.[0]?.message || error.errors?.[0]?.message || 'Invalid input';
}

module.exports = {
  tradeBodySchema,
  transactionsQuerySchema,
  ordersQuerySchema,
  formatZodError,
};
