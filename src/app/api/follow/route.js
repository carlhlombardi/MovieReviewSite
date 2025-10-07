import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// ─────────────────────────────────────────────
//  Helper: parse cookies safely
// ─────────────────────────────────────────────
function parseCookies(header) {
  if (!header) return {};
  const cookies = {};
  header.split(';').forEach((pair) => {
    const [name, ...rest] = pair.trim().split('=');
    cookies[name] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

// ─────────────────────────────────────────────
//  POST /api/follow → follow a user
//  expects: { followingUsername }
// ─────────────────────────────────────────────
export async function POST(req) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'));
    const token = cookies.token;
    if (!token)
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const followerUsername = decoded.username; // ✅ assuming JWT stores username
    const { followingUsername } = await req.json();

    if (!followingUsername)
      return new Response(JSON.stringify({ message: 'Missing followingUsername' }), { status: 400 });

    if (followerUsername === followingUsername)
      return new Response(JSON.stringify({ message: 'Cannot follow yourself' }), { status: 400 });

    await sql`
      INSERT INTO follows (follower_username, following_username)
      VALUES (${followerUsername}, ${followingUsername})
      ON CONFLICT DO NOTHING;
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Follow POST error:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

// ─────────────────────────────────────────────
//  DELETE /api/follow → unfollow a user
//  expects: { followingUsername }
// ─────────────────────────────────────────────
export async function DELETE(req) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'));
    const token = cookies.token;
    if (!token)
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const followerUsername = decoded.username;
    const { followingUsername } = await req.json();

    if (!followingUsername)
      return new Response(JSON.stringify({ message: 'Missing followingUsername' }), { status: 400 });

    await sql`
      DELETE FROM follows
      WHERE follower_username = ${followerUsername}
      AND following_username = ${followingUsername};
    `;

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error('Follow DELETE error:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

// ─────────────────────────────────────────────
//  GET /api/follow/status?username=someone
// ─────────────────────────────────────────────
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const followingUsername = searchParams.get('username');

    if (!followingUsername)
      return new Response(JSON.stringify({ following: false }), { status: 200 });

    const cookies = parseCookies(req.headers.get('cookie'));
    const token = cookies.token;
    if (!token)
      return new Response(JSON.stringify({ following: false }), { status: 200 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const followerUsername = decoded.username;

    const result = await sql`
      SELECT 1 FROM follows
      WHERE follower_username = ${followerUsername}
      AND following_username = ${followingUsername}
      LIMIT 1;
    `;

    return new Response(JSON.stringify({ following: result.rowCount > 0 }), { status: 200 });
  } catch (err) {
    console.error('Follow GET error:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
