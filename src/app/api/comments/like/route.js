import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";

export async function POST(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const username = req.headers.get("x-username");

    if (!id || !username) {
      return NextResponse.json({ error: "Missing id or username" }, { status: 400 });
    }

    // Check if user already liked this comment
    const existing = await sql`
      SELECT * FROM comment_likes WHERE comment_id = ${id} AND username = ${username};
    `;

    let like_count;
    if (existing.rows.length > 0) {
      // Unlike: remove like record and decrement count
      await sql`
        DELETE FROM comment_likes WHERE comment_id = ${id} AND username = ${username};
      `;
      const { rows } = await sql`
        UPDATE comments SET like_count = like_count - 1 WHERE id = ${id} RETURNING like_count;
      `;
      like_count = rows[0].like_count;
    } else {
      // Like: insert like record and increment count
      await sql`
        INSERT INTO comment_likes (comment_id, username) VALUES (${id}, ${username});
      `;
      const { rows } = await sql`
        UPDATE comments SET like_count = like_count + 1 WHERE id = ${id} RETURNING like_count;
      `;
      like_count = rows[0].like_count;
    }

    return NextResponse.json({ like_count });
  } catch (err) {
    console.error("❌ Error toggling like:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
