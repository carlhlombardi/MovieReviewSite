import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const { username } = params;

  try {
    // 🧑 1. Get usernames this user follows
    const followingRes = await sql`
      SELECT following_username 
      FROM follows 
      WHERE follower_username = ${username};
    `;

    const followingUsernames = followingRes.rows.map(row => row.following_username);

    // 🪫 If user follows no one — return empty feed early
    if (followingUsernames.length === 0) {
      return new Response(JSON.stringify({ feed: [] }), { status: 200 });
    }

    // 📰 2. Get activity from followed users
    const activityRes = await sql`
      SELECT a.movie_title, a.action, a.source, a.created_at, u.username
      FROM activity a
      JOIN users u ON a.user_id = u.id
      WHERE u.username = ANY(${sql.array(followingUsernames, 'text')})
      ORDER BY a.created_at DESC
      LIMIT 50;
    `;

    // 🧹 3. Format activity messages
    const formatted = activityRes.rows.map(item => {
      const source = item.source || 'unknown';
      let actionText = '';

      switch (source) {
        case 'mycollection':
          actionText = item.action === 'add'
            ? `added "${item.movie_title}" to My Collection`
            : `removed "${item.movie_title}" from My Collection`;
          break;

        case 'wantedforcollection':
          actionText = item.action === 'want'
            ? `added "${item.movie_title}" to Wanted List`
            : `removed "${item.movie_title}" from Wanted List`;
          break;

        case 'seenit':
          actionText = item.action === 'seen'
            ? `marked "${item.movie_title}" as Seen`
            : `removed "${item.movie_title}" from Seen List`;
          break;

        default:
          actionText = `did something with "${item.movie_title}"`;
      }

      return {
        username: item.username,
        movie_title: item.movie_title,
        action: item.action,
        source: source,
        message: `${item.username} ${actionText}`,
        created_at: item.created_at,
      };
    });

    return new Response(JSON.stringify({ feed: formatted }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in following activity GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
