import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getAuthHeaders } from "../../utils/getAuthHeaders";

// ───────────────────────────────
// GET — Fetch all comments for a movie
// ───────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tmdb_id = searchParams.get("tmdb_id");

    if (!tmdb_id)
      return NextResponse.json({ error: "Missing tmdb_id" }, { status: 400 });

    const result = await sql`
      SELECT id, user_id, username, tmdb_id, content, parent_id, like_count, created_at
      FROM comments
      WHERE tmdb_id = ${tmdb_id}
      ORDER BY created_at ASC;
    `;

    return NextResponse.json(result.rows);
  } catch (err) {
    console.error("GET /api/comments error:", err);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// ───────────────────────────────
// POST — Create new comment or reply
// ───────────────────────────────
export async function POST(req) {
  try {
    const { username, userId } = getAuthHeaders(req);

    if (!username || !userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { tmdb_id, content, parent_id = null, movie_title = null, source = "movie-page" } =
      await req.json();

    if (!tmdb_id || !content)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    const result = await sql`
      INSERT INTO comments (user_id, username, tmdb_id, content, parent_id, movie_title, source)
      VALUES (${userId}, ${username}, ${tmdb_id}, ${content}, ${parent_id}, ${movie_title}, ${source})
      RETURNING id, created_at;
    `;

    return NextResponse.json({
      success: true,
      id: result.rows[0].id,
      created_at: result.rows[0].created_at,
    });
  } catch (err) {
    console.error("POST /api/comments error:", err);
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}

// ───────────────────────────────
// PUT — Edit a comment (must match user)
// ───────────────────────────────
export async function PUT(req) {
  try {
    const { username } = getAuthHeaders(req);
    const { id, content } = await req.json();

    if (!username)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!id || !content)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await sql`
      UPDATE comments
      SET content = ${content}
      WHERE id = ${id} AND username = ${username};
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PUT /api/comments error:", err);
    return NextResponse.json({ error: "Failed to edit comment" }, { status: 500 });
  }
}

// ───────────────────────────────
// DELETE — Delete comment (must match user)
// ───────────────────────────────
export async function DELETE(req) {
  try {
    const { username } = getAuthHeaders(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!username)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!id)
      return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await sql`
      DELETE FROM comments WHERE id = ${id} AND username = ${username};
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/comments error:", err);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
