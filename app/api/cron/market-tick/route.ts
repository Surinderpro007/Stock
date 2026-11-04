export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const connectDB = require('../../../../config/db');
const { getMarketDataProvider } = require('../../../../services/market');

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const provided = req.headers.get('authorization')?.replace('Bearer ', '');

  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const provider = getMarketDataProvider();
    const updates = await provider.refresh();
    return NextResponse.json({ message: 'Market quotes refreshed', updates }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Tick failed' }, { status: 400 });
  }
}