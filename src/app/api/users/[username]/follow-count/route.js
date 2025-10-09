import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const { username } = params;
  const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
  if (userRes.rows.length === 0)
    return new Response(JSON.stringify({ message: 'User not found' }), {
      status: 404,
    });

  const targetId = userRes.rows[0].id;

  const followerCountRes = await sql`
    SELECT COUNT(*)::int AS count FROM follows WHERE following_id = ${targetId}
  `;

  return new Response(
    JSON.stringify({ followersCount: followerCountRes.rows[0].count }),
    { status: 200 }
  );
}
