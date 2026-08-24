import { NextRequest, NextResponse } from 'next/server';
import { resendVerificationOtp } from '../../../controllers/authController';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    const result = await resendVerificationOtp(email);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 400 });
  }
}