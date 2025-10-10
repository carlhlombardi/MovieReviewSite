import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres"; // ✅ using Vercel Postgres

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const delta = parseInt(searchParams.get("delta") || "0");

    if (!id || isNaN(delta)) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { rows } = await sql`
      UPDATE comments
      SET like_count = like_count + ${delta}
      WHERE id = ${id}
      RETURNING like_count;
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json({ like_count: rows[0].like_count });
  } catch (err) {
    console.error("❌ Error updating like count:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
