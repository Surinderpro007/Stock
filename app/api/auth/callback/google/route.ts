import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { loginOrRegisterGoogleUser } from '../../../../../controllers/authController';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', req.url));
  }

  try {
   
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET as string,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI as string,
        grant_type: 'authorization_code',
      }),
    });

     const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Google token exchange failed:', tokenData);
      return NextResponse.redirect(new URL('/login?error=google_auth_failed', req.url));
    }
   
    const profileRes = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );
    const googleProfile = await profileRes.json();

    
    const user = await loginOrRegisterGoogleUser({
      email: googleProfile.email,
      name: googleProfile.name,
      profileImage: googleProfile.picture,
    });

    
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    const response = NextResponse.redirect(new URL('/dashboard', req.url));

    response.cookies.set('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7,
  path: '/',
});

    return response;
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.redirect(new URL('/login?error=google_auth_failed', req.url));
  }
}