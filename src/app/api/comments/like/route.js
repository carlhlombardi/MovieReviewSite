import { NextResponse } from "next/server";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";

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

export async function POST(req) {
  try {
    const user = getUserFromCookie(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const comment_id = searchParams.get("id");
    if (!comment_id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { rows: existingRows } = await sql`
      SELECT 1 FROM comment_likes
      WHERE comment_id = ${comment_id} AND username = ${user.username};
    `;

    let like_count;

    if (existingRows.length > 0) {
      // Unlike
      await sql`
        DELETE FROM comment_likes
        WHERE comment_id = ${comment_id} AND username = ${user.username};
      `;
      const { rows } = await sql`
        UPDATE comments
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = ${comment_id}
        RETURNING like_count;
      `;
      like_count = rows[0]?.like_count ?? 0;
      return NextResponse.json({ like_count, likedByUser: false });
    } else {
      // Like
      await sql`
        INSERT INTO comment_likes (comment_id, username)
        VALUES (${comment_id}, ${user.username});
      `;
      const { rows } = await sql`
        UPDATE comments
        SET like_count = like_count + 1
        WHERE id = ${comment_id}
        RETURNING like_count;
      `;
      like_count = rows[0]?.like_count ?? 1;
      return NextResponse.json({ like_count, likedByUser: true });
    }
  } catch (err) {
    console.error("POST /api/comments/like error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
