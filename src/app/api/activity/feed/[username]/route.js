export const dynamic = 'force-dynamic'; // ⛔ disable caching

import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

/** 🛡️ Verify JWT and ensure it matches the username in the request */
async function verifyUser(req, username) {
  try {
    // Get cookie safely
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map((c) => {
        const [name, ...rest] = c.trim().split('=');
        return [name, decodeURIComponent(rest.join('='))];
      })
    );

    const token = cookies.token;
    if (!token) return null;

    // Decode + verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Confirm username matches the token’s username
    if (!decoded?.username || !decoded?.id) return null;
    if (decoded.username !== username) return null;

    // Verify that the user actually exists
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];
    if (!user || user.id !== decoded.id) return null;

    return user;
  } catch (err) {
    console.warn('⚠️ Invalid or expired token:', err.message);
    return null;
  }
}

/** 📰 GET — Fetch recent activity for the logged-in user */
export async function GET(req, { params }) {
  const { username } = params;

  try {
    // ✅ 1. Verify user via token
    const user = await verifyUser(req, username);
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // ✅ 2. Fetch recent activity
    const { rows } = await sql`
      SELECT a.user_id, u.username, a.movie_title, a.action, a.source, a.created_at
      FROM activity a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ${user.id}
      ORDER BY a.created_at DESC
      LIMIT 5;
    `;

    // ✅ 3. Format the response
    const feed = rows.map((item) => ({
      user_id: item.user_id,
      username: item.username,
      movie_title: item.movie_title,
      action: item.action,
      source: item.source,
      created_at: item.created_at,
    }));

    // ✅ 4. Return JSON
    return new Response(JSON.stringify({ feed }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in activity feed GET:', err);
    return new Response(
      JSON.stringify({ message: 'Server error', error: err.message }),
      { status: 500 }
    );
  }
}
