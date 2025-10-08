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

    // 🟢 2. Fetch user activity, include username via JOIN
    const { rows } = await sql`
      SELECT a.user_id, u.username, a.movie_title, a.action, a.source, a.created_at
      FROM activity a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ${user.id}
      ORDER BY a.created_at DESC
      LIMIT 5;
    `;

    // 🟢 3. Format response
    const formatted = rows.map((item) => ({
      user_id: item.user_id,
      username: item.username,
      movie_title: item.movie_title,
      action: item.action,
      source: item.source,
      created_at: item.created_at,
    }));

    // 🟢 4. Return data
   // 🟢 4. Return data
return new Response(JSON.stringify({ feed: formatted }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in activity feed GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
