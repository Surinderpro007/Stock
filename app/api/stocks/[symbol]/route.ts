export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { getTokenUser } = require('../../../../lib/auth');
const { errorResponse } = require('../../../../lib/apiError');
const { symbolParamSchema, formatZodError } = require('../../../../lib/stockValidation');
const { getStockDetail } = require('../../../../controllers/stockController');

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    // Keep stock details publicly accessible to everyone
    const user = await getTokenUser();

    const { symbol } = await params;
    const parsed = symbolParamSchema.safeParse(symbol);

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const stock = await getStockDetail(parsed.data);
    let forex = null;
    if (stock.currency === 'USD' || stock.market === 'US') {
      const { getUsdInrRate } = require('../../../../services/market/forexService');
      forex = await getUsdInrRate();
    }

    return NextResponse.json({ stock, guest: !user, forex }, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
