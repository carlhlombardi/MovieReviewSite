import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import { getAuthHeaders } from "../../../utils/getAuthHeaders";

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const { userId, username } = getAuthHeaders(req);

    if (!id || !userId || !username) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🕵️ Check if the user already liked this comment
    const existing = await sql`
      SELECT 1 FROM comment_likes
      WHERE comment_id = ${id} AND user_id = ${userId};
    `;

    let like_count;

    if (existing.rows.length > 0) {
      // 👎 Unlike
      await sql`
        DELETE FROM comment_likes
        WHERE comment_id = ${id} AND user_id = ${userId};
      `;

      const { rows } = await sql`
        UPDATE comments
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = ${id}
        RETURNING like_count;
      `;
      like_count = rows[0]?.like_count ?? 0;
    } else {
      // ❤️ Like
      await sql`
        INSERT INTO comment_likes (comment_id, user_id, username)
        VALUES (${id}, ${userId}, ${username});
      `;

      const { rows } = await sql`
        UPDATE comments
        SET like_count = like_count + 1
        WHERE id = ${id}
        RETURNING like_count;
      `;
      like_count = rows[0]?.like_count ?? 1;

      // 📝 Log the activity
      const commentInfo = await sql`
        SELECT movie_title, source FROM comments WHERE id = ${id};
      `;
      const movie_title = commentInfo.rows[0]?.movie_title || null;
      const source = commentInfo.rows[0]?.source || null;

      await sql`
        INSERT INTO activity (user_id, username, action, movie_title, source, created_at)
        VALUES (${userId}, ${username}, 'liked a comment', ${movie_title}, ${source}, NOW());
      `;
    }

    return NextResponse.json({ like_count });
  } catch (err) {
    console.error("❌ Error toggling like:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
