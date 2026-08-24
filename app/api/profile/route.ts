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
  try {
    const userId = await getUserIdFromToken();
    const profile = await getProfile(userId);

    return NextResponse.json({ user: profile }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Something went wrong' },
      { status: 401 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken();
    const body = await req.json();
        const { mobile, countryCode, profileImage, dob } = body;

    const profile = await updateProfile(userId, { mobile, countryCode, profileImage, dob });

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