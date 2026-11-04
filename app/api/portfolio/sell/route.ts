export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { requireUser } = require('../../../../lib/auth');
const { errorResponse } = require('../../../../lib/apiError');
const { tradeBodySchema, formatZodError } = require('../../../../lib/tradeValidation');
const { sellStock } = require('../../../../controllers/portfolioController');

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const parsed = tradeBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const result = await sellStock(user._id, parsed.data.symbol, parsed.data.quantity, {
      orderType: parsed.data.orderType,
      limitPrice: parsed.data.limitPrice,
    });
    return NextResponse.json(
      { message: result.message || 'Sell order placed', trade: result },
      { status: 200 }
    );
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
