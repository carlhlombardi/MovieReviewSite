import { sql } from '@vercel/postgres';

export async function GET() {
  try {
    // Query to fetch data from the `horrormovies` table
    const result = await sql`
      SELECT * FROM horrormovies;
    `;

    // Return the data as JSON
    return new Response(JSON.stringify(result.rows), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    // Return an error response if something goes wrong
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
