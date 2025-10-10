import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";

// ───────────────────────────────
// Helper: extract user info from JWT cookie
// ───────────────────────────────
function getUserFromCookie(req) {
  const cookieHeader = req.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [name, ...rest] = c.trim().split("=");
      return [name, decodeURIComponent(rest.join("="))];
    })
  );
  const token = cookies.token;
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

// ───────────────────────────────
// GET → fetch comments for a movie
// ───────────────────────────────
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const tmdb_id = searchParams.get("tmdb_id");
  if (!tmdb_id)
    return NextResponse.json({ error: "Missing tmdb_id" }, { status: 400 });

  try {
    const { rows } = await sql`
      SELECT c.*, u.username, u.avatar_url
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.tmdb_id = ${tmdb_id}
      ORDER BY c.created_at DESC;
    `;
    return NextResponse.json(rows);
  } catch (err) {
    console.error("GET /api/comments error:", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// ───────────────────────────────
// POST → add a new comment
// ───────────────────────────────
export async function POST(req) {
  const user = getUserFromCookie(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tmdb_id, content, parent_id = null } = await req.json();
  if (!tmdb_id || !content)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    await sql`
      INSERT INTO comments (user_id, tmdb_id, content, parent_id)
      VALUES (${user.id}, ${tmdb_id}, ${content}, ${parent_id});
    `;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/comments error:", err);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}

// ───────────────────────────────
// PUT → edit an existing comment
// ───────────────────────────────
export async function PUT(req) {
  const user = getUserFromCookie(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, content } = await req.json();
  if (!id || !content)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  try {
    const { rowCount } = await sql`
      UPDATE comments
      SET content = ${content}
      WHERE id = ${id} AND user_id = ${user.id};
    `;
    if (rowCount === 0)
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/comments error:", err);
    return NextResponse.json({ error: "Failed to edit comment" }, { status: 500 });
  }
}

// ───────────────────────────────
// DELETE → remove a comment
// ───────────────────────────────
export async function DELETE(req) {
  const user = getUserFromCookie(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id)
    return NextResponse.json({ error: "Missing id" }, { status: 400 });

  try {
    const { rowCount } = await sql`
      DELETE FROM comments
      WHERE id = ${id} AND user_id = ${user.id};
    `;
    if (rowCount === 0)
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/comments error:", err);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
