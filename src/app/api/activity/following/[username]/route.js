import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const { username } = params;

  try {
    // get id of user
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (userRes.rows.length === 0)
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    const userId = userRes.rows[0].id;

    // get IDs of users this user follows
    const followingRes = await sql`
      SELECT following_id FROM follows WHERE follower_id = ${userId};
    `;
    const followingIds = followingRes.rows.map((row) => row.following_id);
    if (followingIds.length === 0)
      return new Response(JSON.stringify({ feed: [] }), { status: 200 });

    // get activity of followed users
    const activityRes = await sql`
      SELECT a.movie_title, a.action, a.source, a.created_at, u.username
      FROM activity a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ANY(${followingIds})
      ORDER BY a.created_at DESC
      LIMIT 50;
    `;

    return new Response(JSON.stringify({ feed: activityRes.rows }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in following activity GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
