export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { requireUser } = require('../../../lib/auth');
const { errorResponse } = require('../../../lib/apiError');
const { getWalletDetails, addFunds, resetWallet } = require('../../../services/walletService');

export async function GET() {
  try {
    const user = await requireUser();
    const wallet = await getWalletDetails(user._id);
    return NextResponse.json({ wallet }, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = await req.json();
    const { action, amount } = body || {};

    let wallet;
    if (action === 'reset') {
      wallet = await resetWallet(user._id);
    } else if (action === 'add') {
      wallet = await addFunds(user._id, amount);
    } else {
      wallet = await addFunds(user._id, amount || 10000);
    }

    return NextResponse.json({ success: true, wallet }, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
