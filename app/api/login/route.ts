import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '../../../controllers/authController';
import jwt from 'jsonwebtoken';

const { loginSchema, formatZodError } = require('../../../lib/validation');

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }

  const { email, password, rememberMe } = parsed.data;

  try {

    const result: any = await loginUser({ email, password });

    if (result.requiresTwoFA) {
      return NextResponse.json(
        { requiresTwoFA: true, email: result.email },
        { status: 200 }
      );
    }

    const expiresIn = rememberMe ? '30d' : '1d';
    const token = jwt.sign(
      { id: result.id, name: result.name, email: result.email },
      process.env.JWT_SECRET as string,
      { expiresIn }
    );

    const response = NextResponse.json({ message: 'Login successful', user: result }, { status: 200 });

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
    if (error.message === 'NEEDS_VERIFICATION') {
      return NextResponse.json({ error: 'NEEDS_VERIFICATION', email }, { status: 403 });
    }
    return NextResponse.json(
      { error: error.message || 'Email or password is incorrect' },
      { status: 401 }
    );
  }
}