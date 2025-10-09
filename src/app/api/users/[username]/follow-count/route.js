import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const { username } = params;

  try {
    // 🧮 Count how many users follow this username
    const followerCountRes = await sql`
      SELECT COUNT(*)::int AS count
      FROM follows
      WHERE following_username = ${username}
    `;

    return new Response(
      JSON.stringify({ followersCount: followerCountRes.rows[0].count }),
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ follow-count API error:', err);
    return new Response(JSON.stringify({ message: 'Server error' }), {
      status: 500,
    });
  }
}
