import { NextRequest, NextResponse } from 'next/server';
import { resetPasswordWithOtp } from '../../../controllers/authController';

export async function POST(req: NextRequest) {
  try {
        const { resetPasswordSchema, formatZodError } = require('../../../lib/validation');
    const body = await req.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
    }

    const { email, otp, newPassword } = parsed.data;

    const result = await resetPasswordWithOtp(email, otp, newPassword);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 400 }
    );
  }
}