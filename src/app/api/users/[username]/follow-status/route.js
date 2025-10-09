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

  try {
    // 🧭 Parse token
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const token = cookies.token;

    let followerId = null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        followerId = decoded.userId;
      } catch (err) {
        console.warn('⚠️ Invalid or expired token in follow-status');
      }
    }

    // 🧭 Get target user
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (userRes.rows.length === 0) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }
    const targetId = userRes.rows[0].id;

    // 🧭 Check if logged-in user follows this target
    let isFollowing = false;
    if (followerId) {
      const followRes = await sql`
        SELECT 1 FROM follows
        WHERE follower_id = ${followerId} AND following_id = ${targetId}
      `;
      isFollowing = followRes.rows.length > 0;
    }

    // 🧮 Count total followers
    const followerCountRes = await sql`
      SELECT COUNT(*)::int AS count FROM follows WHERE following_id = ${targetId}
    `;
    const followersCount = followerCountRes.rows[0].count;

    return new Response(
      JSON.stringify({
        following: isFollowing,
        followersCount,
      }),
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ follow-status API error:', err);
    return new Response(JSON.stringify({ message: 'Server error' }), {
      status: 500,
    });
  }
}
