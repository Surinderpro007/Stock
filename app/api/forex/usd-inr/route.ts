export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
const { getUsdInrRate } = require('../../../../services/market/forexService');

export async function GET() {
  try {
    const data = await getUsdInrRate();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { rate: 88.65, error: error.message || 'Forex service unavailable' },
      { status: 200 }
    );
  }
}
