// /middleware.js
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Only protect /profile/* and /api/protected/*
  if (pathname.startsWith('/profile') || pathname.startsWith('/api/protected')) {
    const cookie = req.cookies.get('token'); // <-- HttpOnly cookie set by backend login

    if (!cookie) {
      // Redirect to login if no cookie
      return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
      // Verify JWT using the same secret
      jwt.verify(cookie.value, process.env.JWT_SECRET);
      // Allow the request
      return NextResponse.next();
    } catch {
      // Invalid token → redirect to login
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  // Everything else is public
  return NextResponse.next();
}

// Optional: limit to only certain paths so middleware doesn’t run on every asset
export const config = {
  matcher: [
    '/profile/:path*',        // protect profile pages
    '/api/protected/:path*',  // protect API routes under /api/protected
  ],
};
