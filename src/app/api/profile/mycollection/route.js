// src/app/api/profile/[username]/mycollection/route.js
// mark this route as dynamic to avoid prerendering error
export const dynamic = 'force-dynamic';

import { sql } from '@vercel/postgres'; // or your DB client

export async function GET(req, { params }) {
  const { username } = params; // ✅ Now it’s defined

  try {
    // adjust to your DB schema
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
