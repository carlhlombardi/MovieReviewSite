import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

/** 🔐 Verify user for protected routes */
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
    if (!user || user.id !== decoded.userId) return null;
    return user;
  } catch (err) {
    console.error('❌ Token verification failed:', err);
    return null;
  }
}

/** ✅ GET: Public — Fetch user collection */
export async function GET(req, { params }) {
  const { username } = params;
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const { rows } = await sql`
      SELECT title, genre, image_url, url, isliked, likedcount
      FROM allmovies
      WHERE username = ${username} AND isliked = TRUE
      ORDER BY title
      LIMIT ${limit};
    `;
    return new Response(JSON.stringify({ movies: rows }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in mycollection GET:', err);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch collection' }),
      { status: 500 }
    );
  }
}

/** ✅ POST: Protected — Add movie & log activity */
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

    // 📝 Upsert movie in allmovies
    await sql`
      INSERT INTO allmovies (username, title, genre, image_url, url, isliked, likedcount)
      VALUES (${username}, ${title}, ${genre}, ${image_url}, ${url}, ${isliked}, ${likedcount})
      ON CONFLICT (username, url)
      DO UPDATE SET
        title = EXCLUDED.title,
        genre = EXCLUDED.genre,
        image_url = EXCLUDED.image_url,
        isliked = EXCLUDED.isliked,
        likedcount = EXCLUDED.likedcount;
    `;

    // 🟢 Log activity (now includes username)
    await sql`
      INSERT INTO activity (user_id, username, movie_title, action, source)
      VALUES (${verified.id}, ${username}, ${title}, 'has', 'mycollection');
    `;

    return new Response(
      JSON.stringify({ message: 'Movie added to collection' }),
      { status: 201 }
    );
  } catch (err) {
    console.error('❌ Error in mycollection POST:', err);
    return new Response(
      JSON.stringify({ message: 'Failed to add movie' }),
      { status: 500 }
    );
  }
}

/** ✅ DELETE: Protected — Remove movie & log activity */
export async function DELETE(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (!verified)
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ message: 'url is required' }),
        { status: 400 }
      );
    }

    // 📝 Get title for activity log before delete
    const { rows } = await sql`
      SELECT title FROM allmovies
      WHERE username = ${username} AND url = ${url}
      LIMIT 1;
    `;
    const movie = rows[0];

    // ❌ Remove from collection
    await sql`
      DELETE FROM allmovies
      WHERE username = ${username} AND url = ${url};
    `;

    // 📝 Log removal (includes username)
    if (movie) {
      await sql`
        INSERT INTO activity (user_id, username, movie_title, action, source)
        VALUES (${verified.id}, ${username}, ${movie.title}, 'doesnt have', 'mycollection');
      `;
    }

    return new Response(
      JSON.stringify({ message: 'Movie removed from collection' }),
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error in mycollection DELETE:', err);
    return new Response(
      JSON.stringify({ message: 'Failed to remove movie' }),
      { status: 500 }
    );
  }
}
