export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const { requireAdmin } = require('../../../../lib/auth');
const { errorResponse } = require('../../../../lib/apiError');
const { getMarketOverview } = require('../../../../controllers/adminMarketController');

export async function GET() {
  try {
    await requireAdmin();
    const overview = await getMarketOverview();
    return NextResponse.json({ overview }, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
