import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

/** 🔐 Verify user for write operations */
async function verifyUser(req, username) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );
  const token = cookies.token;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];
    if (!user) return null;
    if (user.id !== decoded.userId) return null;
    return user;
  } catch {
    return null;
  }
}

/** ✅ GET: Public read (no auth required) */
export async function GET(req, { params }) {
  const { username } = params;

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

/** ✅ POST: Protected + log activity */
export async function POST(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (!verified)
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

  try {
    const body = await req.json();
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

    // 🟢 Log activity: user added a movie
    await sql`
      INSERT INTO activity (user_id, movie_title, action)
      VALUES (${verified.id}, ${title}, 'add');
    `;

    return new Response(JSON.stringify({ message: 'Movie added' }), { status: 201 });
  } catch (err) {
    console.error('Error in mycollection POST:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

/** ✅ DELETE: Protected + log activity */
export async function DELETE(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (!verified)
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ message: 'url is required' }), {
        status: 400,
      });
    }

    // 📝 Fetch movie title before deleting, so we can log it
    const { rows } = await sql`
      SELECT title FROM mycollection
      WHERE username = ${username} AND url = ${url}
      LIMIT 1;
    `;
    const movie = rows[0];

    await sql`
      DELETE FROM mycollection
      WHERE username = ${username} AND url = ${url};
    `;

    // 🟡 Log activity only if movie existed
    if (movie) {
      await sql`
        INSERT INTO activity (user_id, movie_title, action)
        VALUES (${verified.id}, ${movie.title}, 'remove');
      `;
    }

    return new Response(JSON.stringify({ message: 'Movie removed' }), { status: 200 });
  } catch (err) {
    console.error('Error in mycollection DELETE:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
