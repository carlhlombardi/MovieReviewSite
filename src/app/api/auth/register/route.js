import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { username, password, email, firstname, lastname } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // ✅ Check if username or email already exists
    const existing = await sql`
      SELECT id FROM users WHERE username = ${username} OR email = ${email};
    `;

    if (existing.rowCount > 0) {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Insert user record
    const result = await sql`
      INSERT INTO users (username, password, email, firstname, lastname, date_joined, approved, is_admin)
      VALUES (${username}, ${hashedPassword}, ${email || null}, ${firstname || null}, ${lastname || null}, NOW(), true, false)
      RETURNING id, username;
    `;

    const user = result.rows[0];

    // ✅ Create JWT (matches your login + middleware format)
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ Set token cookie
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
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
