import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // adjust import to your db pool

// GET: check if current user has this movie in their collection
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const token = req.headers.get("authorization")?.split(" ")[1];

    // decode user from token (same as your other auth routes)
    const user = await verifyToken(token); // implement verifyToken same as wantedforcollection
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS likecount,
              EXISTS (
                SELECT 1 FROM mycollection WHERE user_id=$1 AND url=$2
              ) AS isliked
       FROM mycollection
       WHERE url=$2`,
      [user.id, url]
    );

    return NextResponse.json(rows[0]);
  } catch (err) {
    console.error("GET mycollection error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// POST: add to mycollection
export async function POST(req) {
  try {
    const body = await req.json();
    const { url } = body;
    const token = req.headers.get("authorization")?.split(" ")[1];
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await pool.query(
      `INSERT INTO mycollection (user_id, url)
       VALUES ($1,$2)
       ON CONFLICT (user_id,url) DO NOTHING`,
      [user.id, url]
    );

    // return updated count
    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS likecount FROM mycollection WHERE url=$1`,
      [url]
    );

    return NextResponse.json({ likeCount: rows[0].likecount });
  } catch (err) {
    console.error("POST mycollection error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// DELETE: remove from mycollection
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    const token = req.headers.get("authorization")?.split(" ")[1];
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await pool.query(
      `DELETE FROM mycollection WHERE user_id=$1 AND url=$2`,
      [user.id, url]
    );

    const { rows } = await pool.query(
      `SELECT COUNT(*)::int AS likecount FROM mycollection WHERE url=$1`,
      [url]
    );

    return NextResponse.json({ likeCount: rows[0].likecount });
  } catch (err) {
    console.error("DELETE mycollection error", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// helper: verify token
async function verifyToken(token) {
  // same logic you’re using in wantedforcollection to decode JWT
  // e.g. const decoded = jwt.verify(token, process.env.JWT_SECRET)
  // return {id: decoded.id}
}
