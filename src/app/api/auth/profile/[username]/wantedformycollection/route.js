import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

// Verify token matches username
async function verifyUser(req, username) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) {
    throw new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Response(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
  }

  const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
  const user = userRes.rows[0];
  if (!user) throw new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
  if (user.id !== decoded.userId)
    throw new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

  return user;
}

// ✅ GET: fetch wanted-for-my-collection movies including iswatched
export async function GET(req, { params }) {
  const { username } = params;
  try {
    await verifyUser(req, username);

    const { rows } = await sql`
      SELECT title, genre, image_url, url, iswatched
      FROM wantedforcollection
      WHERE username = ${username};
    `;
    return new Response(JSON.stringify({ movies: rows }), { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Error in wantedforcollection GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

// ✅ POST: add or mark as wanted / watched
export async function POST(req, { params }) {
  const { username } = params;
  try {
    await verifyUser(req, username);

    // Accept iswatched from the body (default true if missing)
    const { title, genre, image_url, url, iswatched = true } = await req.json();

    if (!title || !url) {
      throw new Response(JSON.stringify({ message: 'title and url are required' }), { status: 400 });
    }

    // Insert or update existing row and set iswatched
    await sql`
      INSERT INTO wantedforcollection (username, title, genre, image_url, url, iswatched)
      VALUES (${username}, ${title}, ${genre}, ${image_url}, ${url}, ${iswatched})
      ON CONFLICT (username, url)
      DO UPDATE SET
        title = EXCLUDED.title,
        genre = EXCLUDED.genre,
        image_url = EXCLUDED.image_url,
        iswatched = ${iswatched};
    `;

    return new Response(JSON.stringify({ message: 'Movie added to wanted list' }), { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Error in wantedforcollection POST:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

// ✅ DELETE: remove from wanted list
export async function DELETE(req, { params }) {
  const { username } = params;
  try {
    await verifyUser(req, username);
    const { url } = await req.json();
    if (!url) {
      throw new Response(JSON.stringify({ message: 'url is required' }), { status: 400 });
    }

    await sql`
      DELETE FROM wantedforcollection
      WHERE username = ${username} AND url = ${url};
    `;
    return new Response(JSON.stringify({ message: 'Movie removed from wanted list' }), { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Error in wantedforcollection DELETE:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
