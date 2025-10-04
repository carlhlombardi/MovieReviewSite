// src/app/api/profile/[username]/mycollection/route.js
import { sql } from '@vercel/postgres'; // or your own DB client

export async function GET(req, { params }) {
  const { username } = params;

  try {
    // Adjust the query to your DB schema
    const { rows } = await sql`
      SELECT url, title, genre, image_url
      FROM mycollection
      WHERE username = ${username} AND isliked = TRUE;
    `;

    return new Response(JSON.stringify({ movies: rows }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DB error:', err);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch collection' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
