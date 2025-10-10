import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "No token found" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await sql`
      SELECT id, username, email, firstname, lastname, avatar_url, bio, is_admin
      FROM users
      WHERE id = ${decoded.id};
    `;

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
