import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { username } = params;

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.split(' ')[1]; // Bearer <token>

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('JWT verify failed:', err);
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // check user exists
    const userRes = await sql`
      SELECT id, username FROM users WHERE username = ${username};
    `;
    const user = userRes.rows[0];
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // ensure token belongs to this user
    if (decoded.userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // fetch their collection
    const collectionRes = await sql`
      SELECT id, title, genre, url, image_url
      FROM mycollection
      WHERE username = ${username};
    `;

    return NextResponse.json({ movies: collectionRes.rows }, { status: 200 });
  } catch (err) {
    console.error('Error in mycollection API:', err);
    return NextResponse.json(
      { message: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}
