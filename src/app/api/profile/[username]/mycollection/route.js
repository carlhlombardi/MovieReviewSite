import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// This tells Next not to statically render
export const dynamic = 'force-dynamic';

// GET /api/profile/:username/mycollection
export async function GET(req, { params }) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json({ error: 'Missing username' }, { status: 400 });
    }

    // Query your Postgres table; adjust the table/columns to your schema
    const { rows } = await pool.query(
      `SELECT 
         id,
         title,
         genre,
         url,
         image_url
       FROM mycollection
       WHERE username = $1`,
      [username]
    );

    return NextResponse.json({ movies: rows });
  } catch (err) {
    console.error('Error fetching mycollection API:', err);
    return NextResponse.json(
      { error: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}
