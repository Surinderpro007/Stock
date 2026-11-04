export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { requireUser } = require('../../../../../lib/auth');
const { errorResponse } = require('../../../../../lib/apiError');
const { cancelOrder } = require('../../../../../controllers/portfolioController');

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const result = await cancelOrder(user._id, id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
