// /app/api/auth/profile/route.js
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

function parseCookies(header) {
  if (!header) return {};
  const cookies = {};
  header.split(';').forEach((pair) => {
    const [name, ...rest] = pair.trim().split('=');
    cookies[name] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}

export async function GET(req) {
  try {
    const cookies = parseCookies(req.headers.get('cookie'));
    const token = cookies.token;
    if (!token) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.username;

    const result = await sql`SELECT username, avatar_url, date_joined, bio FROM users WHERE username=${username}`;

    if (result.rowCount === 0) return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });

    return new Response(JSON.stringify(result.rows[0]), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
