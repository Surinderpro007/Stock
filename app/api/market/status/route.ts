export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { getMarketStatus } = require('../../../../lib/marketStatus');

/**
 * Public, server-authoritative market status.
 *   GET /api/market/status               -> { serverTime, markets: { IN, US } }
 *   GET /api/market/status?market=NYSE   -> { serverTime, market: <status> }
 * Accepts IN, US, NSE, BSE, NASDAQ or NYSE. The client uses `serverTime` to correct for a
 * wrong device clock so the UI and the order gate always agree.
 */
export async function GET(req: NextRequest) {
  const now = new Date();
  const market = req.nextUrl.searchParams.get('market');
  const headers = { 'Cache-Control': 'no-store' };

  if (market) {
    return NextResponse.json(
      { serverTime: now.toISOString(), market: getMarketStatus(market, now) },
      { status: 200, headers }
    );
  }

  return NextResponse.json(
    {
      serverTime: now.toISOString(),
      markets: { IN: getMarketStatus('IN', now), US: getMarketStatus('US', now) },
    },
    { status: 200, headers }
  );
}