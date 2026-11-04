export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from './config/db';
const User = require('./models/User');

const PROTECTED_ROUTES = ['/dashboard', '/profile', '/admin', '/change-password', '/wallet', '/watchlist'];
const AUTH_ROUTES = ['/login', '/register'];

interface DecodedToken {
  id: string;
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  let isValidToken = false;
  let decoded: DecodedToken | null = null;

  if (token) {
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as DecodedToken;
      isValidToken = true;
    } catch {
      isValidToken = false;
    }
  }

  // Check live DB state for suspended/deactivated/deleted accounts
  if (isValidToken && isProtected && decoded?.id) {
    try {
      await connectDB();
      const user = await User.findById(decoded.id).select(
        'isSuspended isDeactivated pendingDeletion deletedByAdmin'
      );

      const isBlocked =
        !user || user.isSuspended || user.isDeactivated ||
        (user.pendingDeletion && user.deletedByAdmin);

      if (isBlocked) {
        const response = NextResponse.redirect(new URL('/login?blocked=1', req.url));
        response.cookies.set('token', '', { httpOnly: true, expires: new Date(0), path: '/' });
        return response;
      }
    } catch {
      // If DB check fails, fall back to JWT-only check
    }
  }

  if (isProtected && !isValidToken) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthRoute && isValidToken) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/admin/:path*',
    '/change-password/:path*',
    '/wallet/:path*',
    '/watchlist/:path*',
    '/login',
    '/register',
  ],
};
