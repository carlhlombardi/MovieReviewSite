import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );
}

export async function GET(req, { params }) {
  const { username } = params;
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies.token;

  let followerId = null;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      followerId = decoded.userId;
    } catch {
      // ignore invalid tokens
    }
  }

  const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
  if (userRes.rows.length === 0)
    return new Response(JSON.stringify({ message: 'User not found' }), {
      status: 404,
    });

  const targetId = userRes.rows[0].id;

  const followCheck =
    followerId &&
    (
      await sql`
        SELECT 1 FROM follows
        WHERE follower_id = ${followerId} AND following_id = ${targetId}
      `
    ).rows.length > 0;

  const followerCountRes = await sql`
    SELECT COUNT(*)::int AS count FROM follows WHERE following_id = ${targetId}
  `;

  return new Response(
    JSON.stringify({
      following: !!followCheck,
      followersCount: followerCountRes.rows[0].count,
    }),
    { status: 200 }
  );
}
