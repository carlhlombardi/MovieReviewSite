import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres"; // works great with Neon too

// 🟡 Get all comments for a movie
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const tmdb_id = searchParams.get("tmdb_id");

  if (!tmdb_id) return NextResponse.json([], { status: 400 });

  const { rows } = await sql`
    SELECT * FROM comments
    WHERE tmdb_id = ${tmdb_id}
    ORDER BY created_at ASC
  `;

  return NextResponse.json(rows);
}

// 🟢 Post new comment or reply
export async function POST(req) {
  const { tmdb_id, content, parent_id, movie_title, source } = await req.json();
  const username = req.headers.get("x-username");
  const userId = req.headers.get("x-userid"); // optional

  if (!username) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await sql`
    INSERT INTO comments (tmdb_id, username, content, parent_id, movie_title, source)
    VALUES (${tmdb_id}, ${username}, ${content}, ${parent_id || null}, ${movie_title}, ${source})
  `;

  await sql`
    INSERT INTO activity (user_id, username, action, movie_title, source, created_at)
    VALUES (
      ${userId || null},
      ${username},
      ${parent_id ? 'replied to a comment' : 'commented on'},
      ${movie_title},
      ${source},
      NOW()
    );
  `;

  return NextResponse.json({ success: true });
}

// ✏️ Edit comment
export async function PUT(req) {
  const { id, content } = await req.json();
  const user = req.headers.get("x-username");

  const { rowCount } = await sql`
    UPDATE comments
    SET content = ${content}, updated_at = NOW()
    WHERE id = ${id} AND username = ${user}
  `;

  if (rowCount === 0) return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  return NextResponse.json({ success: true });
}

// ❌ Delete comment (and replies cascade)
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const user = req.headers.get("x-username");

  await sql`
    DELETE FROM comments
    WHERE id = ${id} AND username = ${user}
  `;

  return NextResponse.json({ success: true });
}

// ❤️ Like or unlike
export async function PATCH(req) {
  const { id, delta } = await req.json();

  await sql`
    UPDATE comments
    SET like_count = like_count + ${delta}
    WHERE id = ${id}
  `;

  return NextResponse.json({ success: true });
}
