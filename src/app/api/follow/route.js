import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";

// ──────────────────────────────
// Helper: parse cookies safely
// ──────────────────────────────
function parseCookies(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(";").map((c) => {
      const [name, ...rest] = c.trim().split("=");
      return [name, decodeURIComponent(rest.join("="))];
    })
  );
}

// ──────────────────────────────
// POST /api/follow → follow a user
// DELETE /api/follow → unfollow a user
// GET /api/follow/status?username=someone → check follow
// GET /api/follow/followers?username=someone → list followers
// GET /api/follow/following?username=someone → list following
// ──────────────────────────────

export async function POST(req) {
  try {
    const cookies = parseCookies(req.headers.get("cookie"));
    const token = cookies.token;
    if (!token) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const followerUsername = decoded.username;

    const { followingUsername } = await req.json();
    if (!followingUsername) return new Response(JSON.stringify({ message: "Missing followingUsername" }), { status: 400 });
    if (followerUsername === followingUsername) return new Response(JSON.stringify({ message: "Cannot follow yourself" }), { status: 400 });

    await sql`
      INSERT INTO follows (follower_username, following_username)
      VALUES (${followerUsername}, ${followingUsername})
      ON CONFLICT DO NOTHING;
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Follow POST error:", err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const cookies = parseCookies(req.headers.get("cookie"));
    const token = cookies.token;
    if (!token) return new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const followerUsername = decoded.username;

    const { followingUsername } = await req.json();
    if (!followingUsername) return new Response(JSON.stringify({ message: "Missing followingUsername" }), { status: 400 });

    await sql`
      DELETE FROM follows
      WHERE follower_username = ${followerUsername}
      AND following_username = ${followingUsername};
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Follow DELETE error:", err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");
    const type = searchParams.get("type"); // 'status', 'followers', 'following'

    if (!type) return new Response(JSON.stringify({ message: "Missing type param" }), { status: 400 });

    const cookies = parseCookies(req.headers.get("cookie"));
    const token = cookies.token;
    let decoded;
    if (token) decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ────────────── Follow Status ──────────────
    if (type === "status") {
      if (!username || !decoded) return new Response(JSON.stringify({ following: false }), { status: 200 });

      const followerUsername = decoded.username;
      const result = await sql`
        SELECT 1 FROM follows
        WHERE follower_username = ${followerUsername}
        AND following_username = ${username}
        LIMIT 1;
      `;
      return new Response(JSON.stringify({ following: result.rowCount > 0 }), { status: 200 });
    }

   // ────────────── Followers ──────────────
if (type === "followers") {
  if (!username) return new Response(JSON.stringify({ users: [] }), { status: 200 });

  const { rows } = await sql`
    SELECT u.username, u.avatar_url
    FROM follows f
    JOIN users u ON f.follower_username = u.username
    WHERE f.following_username = ${username};
  `;

  return new Response(JSON.stringify({ users: rows }), { status: 200 });
}

// ────────────── Following ──────────────
if (type === "following") {
  if (!username) return new Response(JSON.stringify({ users: [] }), { status: 200 });

  const { rows } = await sql`
    SELECT u.username, u.avatar_url
    FROM follows f
    JOIN users u ON f.following_username = u.username
    WHERE f.follower_username = ${username};
  `;

  return new Response(JSON.stringify({ users: rows }), { status: 200 });
}


    return new Response(JSON.stringify({ message: "Invalid type" }), { status: 400 });
  } catch (err) {
    console.error("Follow GET error:", err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
