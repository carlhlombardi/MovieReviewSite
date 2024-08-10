import { sql } from '@vercel/postgres';

export async function GET(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const movieUrl = url.searchParams.get('url');
  const table = url.searchParams.get('table');

  console.log('Table:', table); // Debugging log
  console.log('Movie URL:', movieUrl); // Debugging log

  if (!table || !['horrormovies', 'scifimovies'].includes(table)) {
    console.error('Invalid table specified:', table); // Debugging log
    return new Response('Invalid table specified', { status: 400 });
  }

  try {
    if (movieUrl) {
      // Query to fetch data from the specified table where URL matches
      const result = await sql`
        SELECT * FROM ${sql(table)} WHERE url = ${movieUrl};
      `;

      if (result.rows.length === 0) {
        return new Response('Movie not found', { status: 404 });
      }

      return new Response(JSON.stringify(result.rows[0]), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      // Query to fetch all data from the specified table
      const result = await sql`
        SELECT * FROM ${sql(table)};
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
