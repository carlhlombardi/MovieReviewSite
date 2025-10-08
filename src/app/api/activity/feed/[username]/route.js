import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

/** 🛡️ Optional auth check (currently not used in GET) */
async function verifyUser(req, username) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );
  const token = cookies.token;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];
    if (!user) return null;
    if (user.id !== decoded.userId) return null;
    return user;
  } catch {
    return null;
  }
}

/** 📰 GET — Activity feed for a specific user */
export async function GET(req, { params }) {
  const { username } = params;

  try {
    // 🟢 1. Confirm user exists
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // 🟢 2. Fetch user activity (most recent first)
    const { rows } = await sql`
      SELECT movie_title, action, source, created_at
      FROM activity
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    // 🟢 3. Format entries safely
    const formatted = rows.map((item) => {
      const source = item.source || 'unknown';
      const title = item.movie_title || 'a movie';
      let text = '';

      if (source === 'mycollection') {
        text = item.action === 'add'
          ? `added "${title}" to My Collection`
          : `removed "${title}" from My Collection`;
      } else if (source === 'wantedforcollection') {
        text = item.action === 'want'
          ? `added "${title}" to Wanted List`
          : `removed "${title}" from Wanted List`;
      } else if (source === 'seenit') {
        text = item.action === 'seen'
          ? `marked "${title}" as Seen`
          : `removed "${title}" from Seen List`;
      } else {
        text = `did something with "${title}"`;
      }

      return {
        movie_title: title,
        action: item.action,
        source: source,
        message: `${username} ${text}`,
        created_at: item.created_at,
      };
    });

    // 🟢 4. Return formatted feed
    return new Response(JSON.stringify({ feed: formatted }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in activity feed GET:', err);
    return new Response(
      JSON.stringify({ message: err.message }),
      { status: 500 }
    );
  }
}
