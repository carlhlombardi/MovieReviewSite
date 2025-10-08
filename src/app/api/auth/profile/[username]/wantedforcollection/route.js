import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

/** 🛡️ Verify the authenticated user */
async function verifyUser(req, username) {
  const cookieHeader = req.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader
      .split(';')
      .map((c) => {
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

/** 🟡 GET — Public read (no auth required) */
export async function GET(req, { params }) {
  const { username } = params;

  try {
    const { rows } = await sql`
      SELECT title, genre, image_url, url, iswatched, watchcount
      FROM wantedforcollection
      WHERE username = ${username}
      ORDER BY title;
    `;

    return new Response(JSON.stringify({ movies: rows }), { status: 200 });
  } catch (err) {
    console.error('❌ Error in wantedforcollection GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

/** 🟢 POST — Protected + Log activity */
export async function POST(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (!verified)
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

  try {
    const body = await req.json();
    const {
      title,
      genre = '',
      image_url = '',
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
        iswatched = EXCLUDED.iswatched,
        watchcount = EXCLUDED.watchcount;
    `;

    // 📝 Log activity
    await sql`
      INSERT INTO activity (user_id, movie_title, action, source)
      VALUES (${verified.id}, ${title}, 'want', 'wantedforcollection');
    `;

    return new Response(
      JSON.stringify({ message: 'Movie added to wanted list' }),
      { status: 201 }
    );
  } catch (err) {
    console.error('❌ Error in wantedforcollection POST:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

/** 🔴 DELETE — Protected + Log activity */
export async function DELETE(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (!verified)
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ message: 'url is required' }), { status: 400 });
    }

    // 📝 Get movie title for activity log
    const { rows } = await sql`
      SELECT title FROM wantedforcollection
      WHERE username = ${username} AND url = ${url}
      LIMIT 1;
    `;
    const movie = rows[0];

    await sql`
      DELETE FROM wantedforcollection
      WHERE username = ${username} AND url = ${url};
    `;

    if (movie) {
      await sql`
        INSERT INTO activity (user_id, movie_title, action, source)
        VALUES (${verified.id}, ${movie.title}, 'remove', 'wantedforcollection');
      `;
    }

    return new Response(
      JSON.stringify({ message: 'Movie removed from wanted list' }),
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error in wantedforcollection DELETE:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
