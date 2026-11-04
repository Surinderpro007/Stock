import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { deleteAccount } from '../../../controllers/authController';

interface DecodedToken {
  id: string;
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    const { otp } = await req.json();

    const result = await deleteAccount(decoded.id, otp);

    const response = NextResponse.json(result, { status: 200 });
    response.cookies.set('token', '', { httpOnly: true, expires: new Date(0), path: '/' });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 400 });
  }
}