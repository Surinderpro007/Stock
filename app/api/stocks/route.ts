export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

const { getTokenUser } = require('../../../lib/auth');
const { errorResponse } = require('../../../lib/apiError');
const { listStocksQuerySchema, formatZodError } = require('../../../lib/stockValidation');
const { listStocks } = require('../../../controllers/stockController');

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const parsed = listStocksQuerySchema.safeParse({
      q: searchParams.get('q') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      market: searchParams.get('market') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      order: searchParams.get('order') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const user = await getTokenUser();
    const stocks = await listStocks({
      ...parsed.data,
      includeChange: true,
    });

    return NextResponse.json(
      {
        stocks,
        guest: !user,
      },
      { status: 200 }
    );
  } catch (error: any) {
    const { body, status } = errorResponse(error);
    return NextResponse.json(body, { status });
  }
}
