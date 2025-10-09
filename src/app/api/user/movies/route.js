import { sql } from "@vercel/postgres";
import { NextResponse } from "next/server";

/** ==========================
 *  🟡 GET: Get user movies (joined with allmovies)
 * ========================== */
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
        SELECT 
          um.*,
          am.film,
          am.genre,
          am.image_url,
          am.url
        FROM user_movies um
        JOIN allmovies am ON um.tmdb_id = am.tmdb_id
        WHERE um.username = ${username} AND um.tmdb_id = ${tmdb_id};
      `;
    } else {
      result = await sql`
        SELECT 
          um.*,
          am.film,
          am.genre,
          am.image_url,
          am.url
        FROM user_movies um
        JOIN allmovies am ON um.tmdb_id = am.tmdb_id
        WHERE um.username = ${username}
        ORDER BY um.created_at DESC;
      `;
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("❌ GET user_movies error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** ==========================
 *  🟢 POST: Insert/update movie + log activity
 * ========================== */
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

    // 📝 Insert or update user_movies
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

    // 🟡 Fetch movie info for activity
    const movieRes = await sql`SELECT film, genre FROM allmovies WHERE tmdb_id = ${tmdb_id}`;
    const movie = movieRes.rows[0];

    // 🟡 Get user ID
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];

    if (movie && user) {
      let action = null;
      let source = "mycollection";

      if (is_liked) action = "liked";
      if (is_seen) {
        action = "watched";
        source = "seenit";
      }
      if (is_wanted) {
        action = "added to watchlist";
        source = "wantedforcollection";
      }

      if (action) {
        await sql`
          INSERT INTO activity (user_id, username, action, movie_title, source, created_at)
          VALUES (${user.id}, ${username}, ${action}, ${movie.film}, ${source}, NOW());
        `;
      }
    }

    return NextResponse.json({ message: "✅ Movie updated and activity logged" }, { status: 201 });
  } catch (error) {
    console.error("❌ POST user_movies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** ==========================
 *  🔴 DELETE: Remove movie + log removal
 * ========================== */
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const tmdb_id = searchParams.get("tmdb_id");

    if (!username || !tmdb_id) {
      return NextResponse.json({ error: "Missing username or tmdb_id" }, { status: 400 });
    }

    // 🟡 Fetch movie info for activity before deleting
    const movieRes = await sql`SELECT film, genre FROM allmovies WHERE tmdb_id = ${tmdb_id}`;
    const movie = movieRes.rows[0];

    // 🧹 Delete from user_movies
    await sql`
      DELETE FROM user_movies 
      WHERE username = ${username} AND tmdb_id = ${tmdb_id};
    `;

    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];

    if (movie && user) {
      await sql`
        INSERT INTO activity (user_id, username, action, movie_title, source, created_at)
        VALUES (${user.id}, ${username}, 'removed', ${movie.film}, 'mycollection', NOW());
      `;
    }

    return NextResponse.json({ message: "🗑️ Movie entry deleted and activity logged" });
  } catch (error) {
    console.error("❌ DELETE user_movies error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
