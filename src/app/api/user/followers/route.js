import { sql } from '@vercel/postgres';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username)
      return new Response(JSON.stringify({ error: 'Missing username' }), { status: 400 });

    // Get all followers of this username
    const result = await sql`
      SELECT u.username, u.avatar_url
      FROM follows f
      JOIN users u ON f.follower_username = u.username
      WHERE f.following_username = ${username};
    `;

    return new Response(JSON.stringify({ users: result.rows }), { status: 200 });
  } catch (err) {
    console.error('followers route error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
