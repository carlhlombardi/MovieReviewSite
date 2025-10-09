import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Check for JWT on protected routes
  const cookie = req.cookies.get('token');

  if (!cookie) {
    // No token → redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    // Verify token
    jwt.verify(cookie.value, process.env.JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Invalid token → redirect to login
    return NextResponse.redirect(new URL('/login', req.url));
  }
}

export const config = {
  matcher: [
    // 🔐 Profile pages
    '/profile/:path*',

    // 🔐 API endpoints that require authentication
    '/api/users/:path*/follow-status',     // Follow / Unfollow status checks
    '/api/users/:path*/follow',            // (if you have follow/unfollow actions)

    '/api/activity/following/:path*',      // Following feed (requires logged in user)

    '/api/protected/:path*',               // Any other explicitly protected endpoints
  ],
};
