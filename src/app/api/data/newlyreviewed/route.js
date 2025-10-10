export const dynamic = 'force-dynamic';

import { sql } from '@vercel/postgres';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '8', 10);

    // Select the last 8 reviewed films (review is not null/blank)
    const result = await sql`
      SELECT id, film, genre, tmdb_id, image_url, year, review
      FROM allmovies
      WHERE review IS NOT NULL AND TRIM(review) <> ''
      ORDER BY id DESC
      LIMIT ${limit};
    `;

    return new Response(JSON.stringify({ results: result.rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error fetching newly reviewed movies:', err);
    return new Response(
      JSON.stringify({ message: 'Unable to fetch newly reviewed movies' }),
      { status: 500 }
    );
  }
}
