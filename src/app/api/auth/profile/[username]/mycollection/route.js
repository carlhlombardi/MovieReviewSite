import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

// Utility to verify token and username
async function verifyUser(req, username) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) throw new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userIdFromToken = decoded.userId;

  const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
  const user = userRes.rows[0];
  if (!user) throw new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
  if (user.id !== userIdFromToken)
    throw new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

  return user; // ok
}

// GET: get all movies
export async function GET(req, { params }) {
  const { username } = params;
  try {
    await verifyUser(req, username);

    const moviesRes = await sql`
      SELECT title, genre, image_url, url
      FROM mycollection
      WHERE username = ${username};
    `;
    return new Response(JSON.stringify({ movies: moviesRes.rows }), { status: 200 });
  } catch (err) {
    // err may be a Response already
    if (err instanceof Response) return err;
    console.error('Error in mycollection GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

// POST: add a movie
export async function POST(req, { params }) {
  const { username } = params;
  try {
    await verifyUser(req, username);
    const { title, genre, image_url, url } = await req.json();

    await sql`
      INSERT INTO mycollection (username, title, genre, image_url, url)
      VALUES (${username}, ${title}, ${genre}, ${image_url}, ${url})
    `;
    return new Response(JSON.stringify({ message: 'Movie added' }), { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Error in mycollection POST:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

// DELETE: remove a movie
export async function DELETE(req, { params }) {
  const { username } = params;
  try {
    await verifyUser(req, username);
    const { url } = await req.json();

    await sql`
      DELETE FROM mycollection
      WHERE username = ${username} AND url = ${url}
    `;
    return new Response(JSON.stringify({ message: 'Movie removed' }), { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Error in mycollection DELETE:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
