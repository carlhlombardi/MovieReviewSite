import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

/** ✅ Verify that the token in cookies matches the username */
async function verifyUser(req, username) {
  // Grab cookies from the request
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );
  const token = cookies.token; // our login endpoint sets "token=..."

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

/** ✅ GET /api/auth/profile/[username]/mycollection */
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
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
}

/** ✅ POST /api/auth/profile/[username]/mycollection */
export async function POST(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (verified instanceof Response) return verified;

  try {
    const body = await req.json();
    console.log('📩 mycollection POST body:', body);

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

    return new Response(JSON.stringify({ message: 'Movie added' }), {
      status: 201,
    });
  } catch (err) {
    console.error('Error in mycollection POST:', err);
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
}

/** ✅ DELETE /api/auth/profile/[username]/mycollection */
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
      DELETE FROM mycollection
      WHERE username = ${username} AND url = ${url};
    `;

    return new Response(JSON.stringify({ message: 'Movie removed' }), {
      status: 200,
    });
  } catch (err) {
    console.error('Error in mycollection DELETE:', err);
    return new Response(JSON.stringify({ message: err.message }), {
      status: 500,
    });
  }
}
