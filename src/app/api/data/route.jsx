import { sql } from '@vercel/postgres';

export async function GET(req) {
  const url = new URL(req.url, `http://${req.headers.host}`).searchParams.get('url');

  try {
    if (url) {
      // Query to fetch data from the `horrormovies` table where URL matches
      const result = await sql`
        SELECT * FROM horrormovies WHERE url = ${url};
      `;

      if (result.rows.length === 0) {
        return new Response('Movie not found', { status: 404 });
      }

      return new Response(JSON.stringify(result.rows[0]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // Query to fetch all data from the `horrormovies` table
      const result = await sql`
        SELECT * FROM horrormovies;
      `;

      return new Response(JSON.stringify(result.rows), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
