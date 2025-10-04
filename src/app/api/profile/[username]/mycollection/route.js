import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';
import { NextResponse } from 'next/server';

// Force dynamic rendering so Next doesn’t try to prerender this API
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { username } = params;

    // get Authorization header
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

    // you can check decoded.userId matches the username if needed
    // e.g. only allow the owner to see their own collection:
    const resultUser = await sql`
      SELECT id, username FROM users WHERE username = ${username};
    `;
    const user = resultUser.rows[0];
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // make sure the token belongs to this user
    if (decoded.userId !== user.id) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // now fetch the collection for this username
    const result = await sql`
      SELECT id, title, genre, url, image_url
      FROM mycollection
      WHERE username = ${username};
    `;

    return NextResponse.json({ movies: result.rows }, { status: 200 });
  } catch (err) {
    console.error('Error in mycollection API:', err);
    return NextResponse.json(
      { message: 'Server error', details: err.message },
      { status: 500 }
    );
  }
}
