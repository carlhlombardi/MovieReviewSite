import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }

    // Check for duplicates
    const existing = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existing.rowCount > 0) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await sql`
      INSERT INTO users (username, password)
      VALUES (${username}, ${hashed})
      RETURNING id, username;
    `;

    const user = result.rows[0];

    // ✅ Create JWT (same format as login)
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Set secure cookie
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
    console.error("POST /api/auth/register error:", err);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
