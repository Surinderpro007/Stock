import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { verifyLoginOtp } from '../../../controllers/authController';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, rememberMe } = await req.json();
    if (!email || !otp) {
      return NextResponse.json({ error: 'Email and code are required' }, { status: 400 });
    }

    const user = await verifyLoginOtp(email, otp);

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn }
    );

    const response = NextResponse.json({ message: 'Login successful', user }, { status: 200 });

    const cookieOptions: any = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };
    if (rememberMe) {
      cookieOptions.maxAge = 60 * 60 * 24 * 30;
    }

    response.cookies.set('token', token, cookieOptions);
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 400 });
  }
}