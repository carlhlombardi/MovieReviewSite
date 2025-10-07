import { sql } from '@vercel/postgres';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username)
      return new Response(JSON.stringify({ error: 'Missing username' }), { status: 400 });

    // Get all users that this username follows
    const result = await sql`
      SELECT u.username, u.avatar_url
      FROM follows f
      JOIN users u ON f.following_username = u.username
      WHERE f.follower_username = ${username};
    `;

    return new Response(JSON.stringify({ users: result.rows }), { status: 200 });
  } catch (err) {
    console.error('following route error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
