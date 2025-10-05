// src/app/api/auth/profile/[username]/mycollection/route.js
import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

/** Verify that the token matches the username. */
async function verifyUser(req, username) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) {
    throw new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Response(JSON.stringify({ message: 'Invalid token' }), {
      status: 401,
    });
  }

  const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
  const user = userRes.rows[0];
  if (!user) {
    throw new Response(JSON.stringify({ message: 'User not found' }), {
      status: 404,
    });
  }

  if (user.id !== decoded.userId) {
    throw new Response(JSON.stringify({ message: 'Forbidden' }), {
      status: 403,
    });
  }

  return user; // ok
}

/** GET /api/auth/profile/[username]/mycollection */
export async function GET(req, { params }) {
  const { username } = params;
  try {
    await verifyUser(req, username);

    const { rows } = await sql`
      SELECT title, genre, image_url, url, isliked, iswatched
      FROM mycollection
      WHERE username = ${username}
      ORDER BY title;
    `;
    return new Response(JSON.stringify({ movies: rows }), { status: 200 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Error in mycollection GET:', err);
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
}

/** POST /api/auth/profile/[username]/mycollection */
export async function POST(req, { params }) {
  const { username } = params;
  try {
    await verifyUser(req, username);
    const { title, genre, image_url, url } = await req.json();

    if (!title || !genre || !url) {
      throw new Response(
        JSON.stringify({ message: 'title, genre and url are required' }),
        { status: 400 },
      );
    }

    // Insert or update existing row to isliked=true
    await sql`
      INSERT INTO mycollection (username, title, genre, image_url, url, isliked)
      VALUES (${username}, ${title}, ${genre}, ${image_url}, ${url}, true)
      ON CONFLICT (username, url)
      DO UPDATE SET
        title = EXCLUDED.title,
        genre = EXCLUDED.genre,
        image_url = EXCLUDED.image_url,
        isliked = true;
    `;

    return new Response(JSON.stringify({ message: 'Movie added' }), {
      status: 201,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Error in mycollection POST:', err);
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
}

/** DELETE /api/auth/profile/[username]/mycollection */
export async function DELETE(req, { params }) {
  const { username } = params;
  try {
    await verifyUser(req, username);
    const { url } = await req.json();
    if (!url) {
      throw new Response(JSON.stringify({ message: 'url is required' }), {
        status: 400,
      });
    }

    await sql`
      DELETE FROM mycollection
      WHERE username = ${username} AND url = ${url};
    `;

    return new Response(JSON.stringify({ message: 'Movie removed' }), {
      status: 200,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('Error in mycollection DELETE:', err);
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
}
