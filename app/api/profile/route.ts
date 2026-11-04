// app/api/profile/route.ts

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getProfile, updateProfile } from '../../../controllers/profileController';

interface DecodedToken {
  id: string;
  name: string;
  email: string;
}

async function getUserIdFromToken() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) {
    throw new Error('Login required');
  }

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET as string
  ) as DecodedToken;

  return decoded.id;
}

export async function GET(req: NextRequest) {
  const BLOCKED_MESSAGES: Record<string, string> = {
    ACCOUNT_SUSPENDED: 'Your account has been suspended. Contact support for help.',
    ACCOUNT_DEACTIVATED: 'Your account has been deactivated. Contact support to reactivate it.',
    ACCOUNT_DELETED: 'Your account has been deleted by an administrator. Contact support for help.',
  };

   try {
    const userId = await getUserIdFromToken();
    const profile = await getProfile(userId);
    return NextResponse.json({ user: profile }, { status: 200 });
  } catch (error: any) {
    // 👇 Terminal
    console.error('PROFILE API ERROR:', error);

    const blockedMessage = BLOCKED_MESSAGES[error.message];
    const isAuthError = error.message === 'Login required' || error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError';

    const response = NextResponse.json(
      { error: blockedMessage || error.message || 'Something went wrong', blocked: !!blockedMessage },
      { status: isAuthError || blockedMessage ? 401 : 500 } // 
    );

    if (blockedMessage) {
      response.cookies.set('token', '', { httpOnly: true, expires: new Date(0), path: '/' });
    }

    return response;
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    const body = await req.json();
        const { name, mobile, countryCode, profileImage, dob } = body;

    const profile = await updateProfile(userId, { name, mobile, countryCode, profileImage, dob });

    return NextResponse.json(
      { message: 'Profile updated', user: profile },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 400 }
    );
  }
}