// app/api/profile/[profilename]/mycollection/route.js
import { sql } from '@vercel/postgres';

export async function GET(_request, { params }) {
  const { profilename } = params;

  try {
    const result = await sql`
      SELECT url, title, genre, image_url
      FROM mycollection
      WHERE username = ${profilename} AND isliked = TRUE;
    `;
    return new Response(
      JSON.stringify({ movies: result.rows }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Profile mycollection error:', error);
    return new Response(JSON.stringify({ message: 'Failed to fetch collection' }), {
      status: 500,
    });
  }
}
