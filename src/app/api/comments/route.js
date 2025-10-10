import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres"; // works great with Neon too

// 🟡 Get all comments for a movie
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const tmdb_id = searchParams.get("tmdb_id");

    if (!tmdb_id) {
      return NextResponse.json([], { status: 400 });
    }

    const { rows } = await sql`
      SELECT * FROM comments
      WHERE tmdb_id = ${tmdb_id}
      ORDER BY created_at ASC
    `;

    return NextResponse.json(rows);
  } catch (err) {
    console.error("❌ GET /api/comments failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🟢 Post new comment or reply
export async function POST(req) {
  try {
    const { tmdb_id, content, parent_id, movie_title, source } = await req.json();
    const username = req.headers.get("x-username");
    const userIdHeader = req.headers.get("x-userid");
    const userId = userIdHeader ? parseInt(userIdHeader, 10) : null;

    if (!username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!content || content.trim() === "") {
      return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
    }

    const safeMovieTitle = movie_title && movie_title.trim() !== "" ? movie_title : null;
    const safeSource = source && source.trim() !== "" ? source : null;

    // Insert the comment
    const { rows } = await sql`
      INSERT INTO comments (tmdb_id, username, content, parent_id)
      VALUES (${tmdb_id}, ${username}, ${content}, ${parent_id || null})
      RETURNING *;
    `;
    const newComment = rows[0];

    // Insert into activity
    try {
      await sql`
        INSERT INTO activity (user_id, username, action, movie_title, source, created_at)
        VALUES (
          ${Number.isNaN(userId) ? null : userId},
          ${username},
          ${parent_id ? 'replied to a comment' : 'commented on'},
          ${safeMovieTitle},
          ${safeSource},
          NOW()
        )
      `;
    } catch (err) {
      console.error("❌ Error inserting activity:", err);
    }

    return NextResponse.json(newComment);
  } catch (err) {
    console.error("❌ POST /api/comments failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✏️ Edit comment
export async function PUT(req) {
  try {
    const { id, content } = await req.json();
    const user = req.headers.get("x-username");

    const { rowCount } = await sql`
      UPDATE comments
      SET content = ${content}, updated_at = NOW()
      WHERE id = ${id} AND username = ${user}
    `;

    if (rowCount === 0) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ PUT /api/comments failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ❌ Delete comment (and replies cascade)
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const user = req.headers.get("x-username");

    await sql`
      DELETE FROM comments
      WHERE id = ${id} AND username = ${user}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE /api/comments failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ❤️ Like or unlike comment
export async function PATCH(req) {
  try {
    const { id, delta } = await req.json();

    if (!id || typeof delta !== "number") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await sql`
      UPDATE comments
      SET like_count = like_count + ${delta}
      WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ PATCH /api/comments failed:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
