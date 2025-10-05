import { sql } from '@vercel/postgres';

/**
 * Fetch the newest movies from allmovies
 * @param {Request} request  - incoming HTTP request
 * @returns {Promise<Response>} - JSON response with results
 */
export async function GET(request) {
  try {
    // Parse `limit` param from URL (default 5)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12', 16);

    // Use parameterized query to prevent SQL injection
    const result = await sql`
      SELECT id, film, genre, tmdb_id, image_url, year
      FROM allmovies
      ORDER BY id DESC
      LIMIT ${limit};
    `;

    return new Response(
      JSON.stringify({ results: result.rows }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Error fetching newly added movies:', err);
    return new Response(
      JSON.stringify({ message: 'Unable to fetch newly added movies' }),
      { status: 500 }
    );
  }
}