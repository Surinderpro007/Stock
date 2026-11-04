export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { requireUser } = require('../../../../lib/auth');
const { errorResponse } = require('../../../../lib/apiError');
const { ordersQuerySchema, formatZodError } = require('../../../../lib/tradeValidation');
const { getOrders } = require('../../../../controllers/portfolioController');

export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    const searchParams = req.nextUrl.searchParams;
    const parsed = ordersQuerySchema.safeParse({
      status: searchParams.get('status') ?? undefined,
      symbol: searchParams.get('symbol') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const orders = await getOrders(user._id, parsed.data);
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
