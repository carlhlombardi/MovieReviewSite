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
  const { username } = params; // 👤 target user being viewed

  try {
    // 🧭 Read token from cookies
    const cookieHeader = req.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const token = cookies.token;

    let followerUsername = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Get the logged-in user's username
        const userRes = await sql`
          SELECT username FROM users WHERE id = ${decoded.userId}
        `;
        followerUsername = userRes.rows[0]?.username || null;
      } catch (err) {
        console.warn('⚠️ Invalid or expired token in follow-status:', err.message);
      }
    }

    // 🧭 Check if logged-in user follows this profile
    let isFollowing = false;
    if (followerUsername) {
      const followRes = await sql`
        SELECT 1 FROM follows
        WHERE follower_username = ${followerUsername}
        AND following_username = ${username}
      `;
      isFollowing = followRes.rows.length > 0;
    }

    // 🧮 Count total followers of the target user
    const followerCountRes = await sql`
      SELECT COUNT(*)::int AS count FROM follows
      WHERE following_username = ${username}
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
    return new Response(JSON.stringify({ message: 'Server error' }), { status: 500 });
  }
}
