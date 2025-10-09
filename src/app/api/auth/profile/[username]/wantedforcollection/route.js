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
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const { rows } = await sql`
      SELECT a.id, a.film, a.year, a.run_time, a.my_rating, a.screenwriters, a.producer, a.image_url, a.genre, a.review, a.studio, a.director, a.tmdb_id, a.url, w.iswatched, w.watchcount
      FROM allmovies a
      JOIN wantedforcollection w ON a.url = w.url AND a.username = w.username
      WHERE w.username = ${username} AND w.iswatched = TRUE
      ORDER BY a.film
      LIMIT ${limit};
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
      film,
      genre = '',
      image_url = '',
      url,
      iswatched = true,
      watchcount = 0,
    } = body;

    if (!film || !url) {
      return new Response(
        JSON.stringify({ message: 'film and url are required' }),
        { status: 400 }
      );
    }

    // ✅ Add or update in allmovies (movie details only)
    await sql`
      INSERT INTO allmovies (username, url, film, year, run_time, my_rating, screenwriters, producer, image_url, genre, review, studio, director, tmdb_id)
      VALUES (${username}, ${url}, ${film}, ${year}, ${run_time}, ${my_rating}, ${screenwriters}, ${producer}, ${image_url}, ${genre}, ${review}, ${studio}, ${director}, ${tmdb_id})
      ON CONFLICT (username, url)
      DO UPDATE SET
        film = EXCLUDED.film,
        year = EXCLUDED.year,
        run_time = EXCLUDED.run_time,
        my_rating = EXCLUDED.my_rating,
        screenwriters = EXCLUDED.screenwriters,
        producer = EXCLUDED.producer,
        image_url = EXCLUDED.image_url,
        genre = EXCLUDED.genre,
        review = EXCLUDED.review,
        studio = EXCLUDED.studio,
        director = EXCLUDED.director,
        tmdb_id = EXCLUDED.tmdb_id;
    `;

    // ✅ Add or update in wantedforcollection (iswatched, watchcount)
    await sql`
      INSERT INTO wantedforcollection (username, url, iswatched, watchcount)
      VALUES (${username}, ${url}, ${iswatched}, ${watchcount})
      ON CONFLICT (username, url)
      DO UPDATE SET
        iswatched = EXCLUDED.iswatched,
        watchcount = EXCLUDED.watchcount;
    `;

    // 📝 Log activity (now includes username)
    await sql`
      INSERT INTO activity (user_id, username, movie_title, action, source)
      VALUES (${verified.id}, ${username}, ${film}, 'wants', 'wantedforcollection');
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

  // 📝 Get film for activity log
    const { rows } = await sql`
      SELECT film FROM allmovies
      WHERE username = ${username} AND url = ${url}
      LIMIT 1;
    `;
    const movie = rows[0];

    // ✅ Delete from allmovies
    await sql`
      DELETE FROM allmovies
      WHERE username = ${username} AND url = ${url};
    `;

    // 📝 Log removal if movie was found
    if (movie) {
      await sql`
        INSERT INTO activity (user_id, username, movie_title, action, source)
        VALUES (${verified.id}, ${username}, ${movie.film}, 'doesnt want', 'wantedforcollection');
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
