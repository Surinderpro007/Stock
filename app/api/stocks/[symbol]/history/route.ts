export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { errorResponse } = require('../../../../../lib/apiError');
const {
  symbolParamSchema,
  historyQuerySchema,
  formatZodError,
} = require('../../../../../lib/stockValidation');
const { getStockHistory } = require('../../../../../controllers/stockController');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    // Keep chart history publicly accessible to everyone
    const { symbol } = await params;
    const symbolParsed = symbolParamSchema.safeParse(symbol);
    const rangeParsed = historyQuerySchema.safeParse({
      range: req.nextUrl.searchParams.get('range') ?? undefined,
    });

    if (!symbolParsed.success) {
      return NextResponse.json({ error: formatZodError(symbolParsed.error) }, { status: 400 });
    }

    if (!rangeParsed.success) {
      return NextResponse.json({ error: formatZodError(rangeParsed.error) }, { status: 400 });
    }

    const history = await getStockHistory(symbolParsed.data, rangeParsed.data.range);
    return NextResponse.json({ history }, { status: 200 });
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
