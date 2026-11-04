export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { requireUser } = require('../../../lib/auth');
const { errorResponse } = require('../../../lib/apiError');
const { transactionsQuerySchema, formatZodError } = require('../../../lib/tradeValidation');
const { getTransactions } = require('../../../controllers/portfolioController');

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = transactionsQuerySchema.safeParse({
      page: req.nextUrl.searchParams.get('page') ?? undefined,
      limit: req.nextUrl.searchParams.get('limit') ?? undefined,
      type: req.nextUrl.searchParams.get('type') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const result = await getTransactions(user._id, parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
