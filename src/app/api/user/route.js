import { sql } from '@vercel/postgres';

// GET /api/user/following?username=test
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return new Response(JSON.stringify({ message: 'Missing username' }), { status: 400 });
    }

    // Get everyone this user is following
    const result = await sql`
      SELECT u.username, u.avatar_url
      FROM follows f
      JOIN users u ON f.following_username = u.username
      WHERE f.follower_username = ${username};
    `;

    return new Response(
      JSON.stringify({ following: result.rows }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Following GET error:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
