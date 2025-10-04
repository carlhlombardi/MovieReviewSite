// src/app/api/profile/[username]/mycollection/route.js
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // same auth config you use in (auth)/profile

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  // check session
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // make sure logged-in user is only fetching their own data
  if (params.username !== session.user.name) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, title, genre, url, image_url
       FROM mycollection
       WHERE username = $1`,
      [params.username]
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
