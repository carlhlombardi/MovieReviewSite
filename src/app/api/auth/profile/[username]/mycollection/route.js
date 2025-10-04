// src/app/api/profile/[username]/mycollection/route.js
export const dynamic = 'force-dynamic'; // prevents static generation

// use your actual DB client instead of fake data:
import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const { username } = params;

  try {
    // your DB query
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
    console.error(err);
    return new Response(JSON.stringify({ error: 'DB error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
