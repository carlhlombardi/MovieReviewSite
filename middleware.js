import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function middleware(req) {
  const cookie = req.cookies.get("token");

  // 🚫 No token → redirect to login
  if (!cookie) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    // ✅ Verify and decode token (must match login payload)
    const decoded = jwt.verify(cookie.value, process.env.JWT_SECRET);

    if (!decoded?.id || !decoded?.username) {
      console.error("❌ Token missing required fields");
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // ✅ Attach user info to headers for API routes
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-userid", decoded.id.toString());
    requestHeaders.set("x-username", decoded.username);

    // ✅ Continue with modified request
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (err) {
    console.error("❌ Invalid or expired token:", err.message);
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/api/users/:path*/follow-status",
    "/api/users/:path*/follow",
    "/api/activity/following/:path*",
    "/api/comments/:path*", // ✅ Protect all comment actions
    "/api/protected/:path*",
  ],
};
