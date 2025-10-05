import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

/** ✅ Verify JWT from cookie instead of Authorization header */
async function verifyUser(req, username) {
  // Grab all cookies from header
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );
  const token = cookies.token;

  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid token' }), {
      status: 401,
    });
  }

  // Confirm the username belongs to this user id
  const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
  const user = userRes.rows[0];
  if (!user) {
    return new Response(JSON.stringify({ message: 'User not found' }), {
      status: 404,
    });
  }
  if (user.id !== decoded.userId) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), {
      status: 403,
    });
  }

  return user;
}

/** ✅ GET: fetch wanted-for-my-collection movies including iswatched & watchcount */
export async function GET(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (verified instanceof Response) return verified;

  try {
    const { rows } = await sql`
      SELECT title, genre, image_url, url, iswatched, watchcount
      FROM wantedforcollection
      WHERE username = ${username}
      ORDER BY title;
    `;
    return new Response(JSON.stringify({ movies: rows }), { status: 200 });
  } catch (err) {
    console.error('Error in wantedforcollection GET:', err);
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
}

/** ✅ POST: add or update wanted movie with iswatched + watchcount */
export async function POST(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (verified instanceof Response) return verified;

  try {
    const body = await req.json();
    console.log('📩 wantedforcollection POST body:', body);
    const {
      title,
      genre,
      image_url,
      url,
      iswatched = true,
      watchcount = 0,
    } = body;

    if (!title || !url) {
      return new Response(
        JSON.stringify({ message: 'title and url are required' }),
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO wantedforcollection (username, url, title, genre, iswatched, watchcount, image_url)
      VALUES (${username}, ${url}, ${title}, ${genre}, ${iswatched}, ${watchcount}, ${image_url})
      ON CONFLICT (username, url)
      DO UPDATE SET
        title = EXCLUDED.title,
        genre = EXCLUDED.genre,
        image_url = EXCLUDED.image_url,
        iswatched = ${iswatched},
        watchcount = ${watchcount};
    `;

    return new Response(
      JSON.stringify({ message: 'Movie added to wanted list' }),
      { status: 201 }
    );
  } catch (err) {
    console.error('❌ Error in wantedforcollection POST:', err);
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
}

/** ✅ DELETE: remove from wanted list */
export async function DELETE(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (verified instanceof Response) return verified;

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ message: 'url is required' }), {
        status: 400,
      });
    }

    await sql`
      DELETE FROM wantedforcollection
      WHERE username = ${username} AND url = ${url};
    `;
    return new Response(
      JSON.stringify({ message: 'Movie removed from wanted list' }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in wantedforcollection DELETE:', err);
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
}
