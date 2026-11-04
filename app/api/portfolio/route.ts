export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const { requireUser } = require('../../../lib/auth');
const { errorResponse } = require('../../../lib/apiError');
const { getPortfolio } = require('../../../controllers/portfolioController');

export async function GET() {
  try {
    const user = await requireUser();
    const portfolio = await getPortfolio(user._id);
    return NextResponse.json({ portfolio }, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
