import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  try {
    const { username } = params;

    // get all liked movies for this user
    const result = await sql`
      SELECT url, title, genre, image_url
      FROM mycollection
      WHERE username = ${username} AND isliked = TRUE;
    `;

    return new Response(
      JSON.stringify({ movies: result.rows }),
      { status: 200 }
    );
  } catch (err) {
    console.error('API error /profile/[username]/mycollection:', err);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch collection' }),
      { status: 500 }
    );
  }
}
