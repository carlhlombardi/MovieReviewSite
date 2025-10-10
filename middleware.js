import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const cookie = req.cookies.get("token");

  // If no token, redirect to login
  if (!cookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // ✅ Verify and decode token
    const decoded = jwt.verify(cookie.value, process.env.JWT_SECRET);

    // ✅ Attach user info to request headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-userid", decoded.id?.toString());
    requestHeaders.set("x-username", decoded.username);

    const res = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

    return res;
  } catch (err) {
    console.error("❌ Invalid token:", err);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/api/users/:path*/follow-status",
    "/api/users/:path*/follow",
    "/api/activity/following/:path*",
    "/api/comments/:path*",     // ✅ protect like API
    "/api/protected/:path*",
  ],
};
