import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

/** 🛡️ Optional auth check */
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
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    }

    const { rows } = await sql`
      SELECT movie_title, action, source, created_at
      FROM activity
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    const formatted = rows.map((item) => {
      let text = '';
      if (item.source === 'mycollection') {
        text = item.action === 'add'
          ? `added "${item.movie_title}" to My Collection`
          : `removed "${item.movie_title}" from My Collection`;
      } else if (item.source === 'wantedforcollection') {
        text = item.action === 'want'
          ? `added "${item.movie_title}" to Wanted List`
          : `removed "${item.movie_title}" from Wanted List`;
      } else if (item.source === 'seenit') {
        text = item.action === 'seen'
          ? `marked "${item.movie_title}" as Seen`
          : `removed "${item.movie_title}" from Seen List`;
      }

      return {
        movie_title: item.movie_title,
        action: item.action,
        source: item.source,
        message: `${username} ${text}`,
        created_at: item.created_at,
      };
    });

    return new Response(JSON.stringify({ feed: formatted }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in activity feed GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
