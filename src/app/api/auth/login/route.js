import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // find user
    const result = await sql`
      SELECT id, username, password FROM users WHERE username = ${username};
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = result.rows[0];
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Create JWT
const token = jwt.sign(
  { 
    id: user.id, 
    username: user.username, 
    avatar_url: user.avatar_url   // <-- add this
  },
  process.env.JWT_SECRET,
  { expiresIn: "7d" }
);


    // ✅ Set cookie with correct flags
    const res = NextResponse.json({
      success: true,
      username: user.username,
      id: user.id,
    });

    res.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return res;
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
