// app/api/users/[username]/route.js
import { pool } from '@/lib/db';

export async function GET(req, { params }) {
  const username = params.username;

  const { rows } = await pool.query(
    'SELECT username, firstname, avatar_url, bio, date_joined FROM users WHERE username = $1',
    [username]
  );

  if (rows.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(JSON.stringify(rows[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
