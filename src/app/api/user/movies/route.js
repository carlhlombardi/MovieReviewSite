import { NextResponse } from "next/server";
import pkg from "pg";
const { Pool } = pkg;

// 🧰 Create DB pool directly here (no lib/db)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // ⬅️ Make sure this is set in .env.local
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

// 🟡 GET: Get user movie data (all or specific)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const tmdb_id = searchParams.get("tmdb_id");

  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  try {
    let result;
    if (tmdb_id) {
      result = await pool.query(
        `SELECT * FROM user_movies WHERE username = $1 AND tmdb_id = $2`,
        [username, tmdb_id]
      );
    } else {
      result = await pool.query(
        `SELECT * FROM user_movies WHERE username = $1 ORDER BY created_at DESC`,
        [username]
      );
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("GET user_movies error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🟢 POST: Add or update movie interaction (like, seen, wanted, rating, review)
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

    await pool.query(
      `INSERT INTO user_movies (username, tmdb_id, is_liked, is_seen, is_wanted, watch_count, personal_rating, personal_review)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (username, tmdb_id)
       DO UPDATE SET
         is_liked = EXCLUDED.is_liked,
         is_seen = EXCLUDED.is_seen,
         is_wanted = EXCLUDED.is_wanted,
         watch_count = EXCLUDED.watch_count,
         personal_rating = EXCLUDED.personal_rating,
         personal_review = EXCLUDED.personal_review`,
      [username, tmdb_id, is_liked, is_seen, is_wanted, watch_count, personal_rating, personal_review]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST user_movies error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// 🔴 DELETE: Remove a user’s movie entry
export async function DELETE(req) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");
  const tmdb_id = searchParams.get("tmdb_id");

  if (!username || !tmdb_id) {
    return NextResponse.json({ error: "Missing username or tmdb_id" }, { status: 400 });
  }

  try {
    await pool.query(
      `DELETE FROM user_movies WHERE username = $1 AND tmdb_id = $2`,
      [username, tmdb_id]
    );
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE user_movies error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
