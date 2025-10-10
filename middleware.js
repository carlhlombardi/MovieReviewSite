import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function middleware(req) {
  // Allow all GET requests through
  if (req.method === "GET") {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("token");
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(cookie.value, process.env.JWT_SECRET);
    if (!decoded?.id || !decoded?.username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-userid", decoded.id.toString());
    requestHeaders.set("x-username", decoded.username);

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export const config = {
  matcher: [
    "/api/comments/:path*",
    "/api/users/:path*",
    "/api/activity/:path*",
    "/profile/:path*",
  ],
};
