import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const username = params.username;

  const { rows } = await sql`
    SELECT username, firstname, avatar_url, bio, date_joined
    FROM users
    WHERE username = ${username};
  `;

  if (rows.length === 0) {
    return new Response(JSON.stringify({ message: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(rows[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
