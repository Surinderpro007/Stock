export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { requireUser } = require('../../../lib/auth');
const { errorResponse } = require('../../../lib/apiError');
const {
  getWatchlist,
  toggleWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} = require('../../../controllers/watchlistController');

export async function GET() {
  try {
    const user = await requireUser();
    const result = await getWatchlist(user._id);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { symbol, action = 'toggle' } = body || {};

    let result;
    if (action === 'add') {
      result = await addToWatchlist(user._id, symbol);
    } else if (action === 'remove') {
      result = await removeFromWatchlist(user._id, symbol);
    } else {
      result = await toggleWatchlist(user._id, symbol);
    }

    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(req.url);
    let symbol = searchParams.get('symbol');

    if (!symbol) {
      try {
        const body = await req.json();
        symbol = body.symbol;
      } catch {
        // empty body
      }
    }

    const result = await removeFromWatchlist(user._id, symbol);
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
