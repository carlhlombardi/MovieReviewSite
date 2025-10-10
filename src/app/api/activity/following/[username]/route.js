export const dynamic = 'force-dynamic';

import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

/** 🛡️ Verify JWT and ensure the user matches the requested username */
async function verifyUser(req, username) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [name, ...rest] = c.trim().split('=');
        return [name, decodeURIComponent(rest.join('='))];
      })
    );

    const token = cookies.token;
    if (!token) return null;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ Match by username and id
    if (!decoded?.username || !decoded?.id) return null;
    if (decoded.username !== username) return null;

    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];
    if (!user || user.id !== decoded.id) return null;

    return user;
  } catch (err) {
    console.warn('⚠️ Invalid or expired token:', err.message);
    return null;
  }
}

/** 📰 GET — Activity feed from followed users */
export async function GET(req, { params }) {
  const { username } = params;

  try {
    // ✅ 1. Verify user
    const user = await verifyUser(req, username);
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // ✅ 2. Get usernames this user follows
    const followingRes = await sql`
      SELECT following_username
      FROM follows
      WHERE follower_username = ${username};
    `;
    const followingUsernames = followingRes.rows.map(
      (row) => row.following_username
    );

    // 🪫 3. If user follows no one — return empty feed
    if (followingUsernames.length === 0) {
      return new Response(JSON.stringify({ feed: [] }), { status: 200 });
    }

    // 📰 4. Get activity from followed users
    const activityRes = await sql`
      SELECT 
        a.user_id,
        u.username,
        a.movie_title,
        a.action,
        a.source,
        a.created_at
      FROM activity a
      JOIN users u ON a.user_id = u.id
      WHERE u.username = ANY(${followingUsernames})
      ORDER BY a.created_at DESC
      LIMIT 5;
    `;

    // 🧹 5. Format feed entries
    const formatted = activityRes.rows.map((item) => {
      const source = item.source || 'unknown';
      let text;

      switch (source) {
        case 'mycollection':
          text =
            item.action === 'has'
              ? `added "${item.movie_title}" to My Collection`
              : `removed "${item.movie_title}" from My Collection`;
          break;
        case 'wantedforcollection':
          text =
            item.action === 'wants'
              ? `added "${item.movie_title}" to Wanted List`
              : `removed "${item.movie_title}" from Wanted List`;
          break;
        case 'seenit':
          text =
            item.action === 'has seen'
              ? `marked "${item.movie_title}" as Seen`
              : `removed "${item.movie_title}" from Seen List`;
          break;
        default:
          text = `did something with "${item.movie_title}"`;
      }

      return {
        user_id: item.user_id,
        username: item.username,
        movie_title: item.movie_title,
        action: item.action,
        source,
        message: `${item.username} ${text}`,
        created_at: item.created_at,
      };
    });

    // ✅ 6. Return feed
    return new Response(JSON.stringify({ feed: formatted }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in following activity GET:', err);
    return new Response(
      JSON.stringify({ message: 'Server error', error: err.message }),
      { status: 500 }
    );
  }
}
