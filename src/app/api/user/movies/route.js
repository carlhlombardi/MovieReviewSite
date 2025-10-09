import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

// 🟡 GET: Get all or specific user movie entry
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const tmdb_id = searchParams.get("tmdb_id");

    if (!username) {
      return NextResponse.json({ error: "Missing username" }, { status: 400 });
    }

    let result;
    if (tmdb_id) {
      result = await sql`
        SELECT * FROM user_movies 
        WHERE username = ${username} AND tmdb_id = ${tmdb_id};
      `;
    } else {
      result = await sql`
        SELECT * FROM user_movies 
        WHERE username = ${username}
        ORDER BY created_at DESC;
      `;
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("❌ GET user_movies error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🟢 POST: Insert or update a user's movie interaction
export async function POST(req) {
  try {
    const body = await req.json();
    const {
      username,
      tmdb_id,
      is_liked = false,
      is_seen = false,
      is_wanted = false,
      watch_count = 0,
      personal_rating = null,
      personal_review = null,
    } = body;

    if (!username || !tmdb_id) {
      return NextResponse.json({ error: "Missing username or tmdb_id" }, { status: 400 });
    }

    // 📝 Insert or update
    await sql`
      INSERT INTO user_movies (username, tmdb_id, is_liked, is_seen, is_wanted, watch_count, personal_rating, personal_review)
      VALUES (${username}, ${tmdb_id}, ${is_liked}, ${is_seen}, ${is_wanted}, ${watch_count}, ${personal_rating}, ${personal_review})
      ON CONFLICT (username, tmdb_id)
      DO UPDATE SET
        is_liked = EXCLUDED.is_liked,
        is_seen = EXCLUDED.is_seen,
        is_wanted = EXCLUDED.is_wanted,
        watch_count = EXCLUDED.watch_count,
        personal_rating = EXCLUDED.personal_rating,
        personal_review = EXCLUDED.personal_review;
    `;

    return NextResponse.json({ message: "✅ User movie updated successfully" }, { status: 201 });
  } catch (error) {
    console.error("❌ POST user_movies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 🔴 DELETE: Remove user movie entry
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const tmdb_id = searchParams.get("tmdb_id");

    if (!username || !tmdb_id) {
      return NextResponse.json({ error: "Missing username or tmdb_id" }, { status: 400 });
    }

    await sql`
      DELETE FROM user_movies 
      WHERE username = ${username} AND tmdb_id = ${tmdb_id};
    `;

    return NextResponse.json({ message: "🗑️ Movie entry deleted" });
  } catch (error) {
    console.error("❌ DELETE user_movies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}