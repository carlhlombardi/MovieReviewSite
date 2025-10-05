import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const { username } = params;
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];
    if (!user) return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    if (user.id !== decoded.userId) return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

    const moviesRes = await sql`
      SELECT title, genre, image_url, url, isliked, iswatched
      FROM mycollection
      WHERE username = ${username};
    `;
    return new Response(JSON.stringify({ movies: moviesRes.rows }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Invalid token', error: err.message }), { status: 401 });
  }
}

export async function POST(req, { params }) {
  const { username } = params;
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  const body = await req.json();
  const { url } = body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];
    if (!user || user.id !== decoded.userId) return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

    await sql`
      INSERT INTO mycollection (username, url, isliked)
      VALUES (${username}, ${url}, true)
      ON CONFLICT (username, url)
      DO UPDATE SET isliked = true;
    `;
    return new Response(JSON.stringify({ message: 'Liked added' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Server error', error: err.message }), { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const { username } = params;
  const token = req.headers.get('authorization')?.split(' ')[1];
  if (!token) return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  const { searchParams } = new URL(req.url);
  const url = searchParams.get('url');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];
    if (!user || user.id !== decoded.userId) return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

    await sql`
      UPDATE mycollection
      SET isliked = false
      WHERE username = ${username} AND url = ${url};
    `;
    return new Response(JSON.stringify({ message: 'Like removed' }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ message: 'Server error', error: err.message }), { status: 500 });
  }
}
