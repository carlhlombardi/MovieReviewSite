import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

/** Verify that the token matches the username and return the user row. */
async function verifyUser(req, username) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return new Response(JSON.stringify({ message: 'Invalid token' }), { status: 401 });
  }

  const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
  const user = userRes.rows[0];
  if (!user) {
    return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
  }
  if (user.id !== decoded.userId) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  return user;
}

/** GET /api/auth/profile/[username]/mycollection */
export async function GET(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (verified instanceof Response) return verified;

  try {
    const { rows } = await sql`
      SELECT title, genre, image_url, url, isliked, likedcount
      FROM mycollection
      WHERE username = ${username}
      ORDER BY title;
    `;
    return new Response(JSON.stringify({ movies: rows }), { status: 200 });
  } catch (err) {
    console.error('Error in mycollection GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

/** POST /api/auth/profile/[username]/mycollection */
export async function POST(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (verified instanceof Response) return verified;

  try {
    const body = await req.json();

    // 2️⃣ Log it to Vercel logs
    console.log('📩 wantedforcollection POST body:', body);

    const { title, genre, image_url, url, isliked = true, likedcount = 0 } = body;

    if (!title || !genre || !url) {
      return new Response(
        JSON.stringify({ message: 'title, genre and url are required' }),
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO mycollection (username, title, genre, image_url, url, isliked, likedcount)
      VALUES (${username}, ${title}, ${genre}, ${image_url}, ${url}, ${isliked}, ${likedcount})
      ON CONFLICT (username, url)
      DO UPDATE SET
        title = EXCLUDED.title,
        genre = EXCLUDED.genre,
        image_url = EXCLUDED.image_url,
        isliked = ${isliked},
        likedcount = ${likedcount};
    `;

    return new Response(JSON.stringify({ message: 'Movie added' }), { status: 201 });
  } catch (err) {
    console.error('Error in mycollection POST:', err);
    console.log('req body', await req.json());
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}


/** DELETE /api/auth/profile/[username]/mycollection */
export async function DELETE(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (verified instanceof Response) return verified;

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ message: 'url is required' }), { status: 400 });
    }

    await sql`
      DELETE FROM mycollection
      WHERE username = ${username} AND url = ${url};
    `;

    return new Response(JSON.stringify({ message: 'Movie removed' }), { status: 200 });
  } catch (err) {
    console.error('Error in mycollection DELETE:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
