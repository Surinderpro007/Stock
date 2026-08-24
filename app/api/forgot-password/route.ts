import { NextRequest, NextResponse } from 'next/server';
import { requestPasswordResetOtp } from '../../../controllers/authController';

export async function POST(req: NextRequest) {
  try {
       const { forgotPasswordSchema, formatZodError } = require('../../../lib/validation');
    const body = await req.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { email } = parsed.data;

    const result = await requestPasswordResetOtp(email);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 400 }
    );
  }
}