import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const username = req.headers.get("x-username");
    const userId = req.headers.get("x-userid");

    if (!id || !username) {
      return NextResponse.json({ error: "Missing id or username" }, { status: 400 });
    }

    const existing = await sql`
      SELECT 1 FROM comment_likes WHERE comment_id = ${id} AND username = ${username};
    `;

    let like_count;

    if (existing.rows.length > 0) {
      // Unlike
      await sql`
        DELETE FROM comment_likes WHERE comment_id = ${id} AND username = ${username};
      `;
      const { rows } = await sql`
        UPDATE comments SET like_count = like_count - 1 WHERE id = ${id} RETURNING like_count;
      `;
      like_count = rows[0].like_count;
    } else {
      // Like
      await sql`
        INSERT INTO comment_likes (comment_id, username) VALUES (${id}, ${username});
      `;
      const { rows } = await sql`
        UPDATE comments SET like_count = like_count + 1 WHERE id = ${id} RETURNING like_count;
      `;
      like_count = rows[0].like_count;

      // Insert into activity
      await sql`
        INSERT INTO activity (user_id, username, action, created_at)
        VALUES (${userId || null}, ${username}, 'liked a comment', NOW());
      `;
    }

    return NextResponse.json({ like_count });
  } catch (err) {
    console.error("❌ Error toggling like:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
