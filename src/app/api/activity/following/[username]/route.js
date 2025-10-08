import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const { username } = params;

  try {
    // 1. Get ID of the user making the request
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (userRes.rows.length === 0) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    }
    const userId = userRes.rows[0].id;

    // 2. Get IDs of users this user follows
    const followingRes = await sql`
      SELECT following_id FROM follows WHERE follower_id = ${userId};
    `;
    const followingIds = followingRes.rows.map((row) => row.following_id);

    // if they follow no one, return empty feed
    if (followingIds.length === 0) {
      return new Response(JSON.stringify({ feed: [] }), { status: 200 });
    }

    // 3. Get activity of followed users
    const activityRes = await sql`
      SELECT a.movie_title, a.action, a.source, a.created_at, u.username
      FROM activity a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = ANY(${followingIds})
      ORDER BY a.created_at DESC
      LIMIT 50;
    `;

    // 4. Format feed messages
    const formatted = activityRes.rows.map((item) => {
      let text = '';
      if (item.source === 'mycollection') {
        text = item.action === 'add'
          ? `added "${item.movie_title}" to My Collection`
          : `removed "${item.movie_title}" from My Collection`;
      } else if (item.source === 'wantedforcollection') {
        text = item.action === 'want'
          ? `added "${item.movie_title}" to Wanted List`
          : `removed "${item.movie_title}" from Wanted List`;
      } else if (item.source === 'seenit') {
        text = item.action === 'seen'
          ? `marked "${item.movie_title}" as Seen`
          : `removed "${item.movie_title}" from Seen List`;
      }

      return {
        username: item.username,
        movie_title: item.movie_title,
        action: item.action,
        source: item.source,
        message: `${item.username} ${text}`,
        created_at: item.created_at,
      };
    });

    return new Response(JSON.stringify({ feed: formatted }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in following activity GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
