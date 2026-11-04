import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { changeEmail } from '../../../controllers/authController';

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
    const { newEmail, otp } = await req.json();

    if (!newEmail || !otp) {
      return NextResponse.json({ error: 'New email and code are required' }, { status: 400 });
    }

    const result = await changeEmail(decoded.id, newEmail, otp);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 400 });
  }
}