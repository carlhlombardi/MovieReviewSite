import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const username = params.username;

  const result = await sql`
    SELECT username, firstname, avatar_url, bio, date_joined
    FROM users
    WHERE username = ${username};
  `;

  if (result.rows.length === 0) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(JSON.stringify(result.rows[0]), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
