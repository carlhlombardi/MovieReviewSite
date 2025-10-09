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

/** 🟡 GET — Public (fetch seen movies for a user) */
export async function GET(req, { params }) {
  const { username } = params;
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const { rows } = await sql`
      SELECT a.id, a.film, a.year, a.run_time, a.my_rating, a.screenwriters,
             a.producer, a.image_url, a.genre, a.review, a.studio, a.director,
             a.tmdb_id, a.url, s.seenit, s.created_at
      FROM seenit s
      JOIN allmovies a ON a.url = s.url
      WHERE s.username = ${username} AND s.seenit = TRUE
      ORDER BY s.created_at DESC
      LIMIT ${limit};
    `;

    return new Response(JSON.stringify({ movies: rows, total: rows.length }), {
      status: 200,
    });
  } catch (err) {
    console.error('❌ Error in seenit GET:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

/** 🟢 POST — Protected (mark movie as seen) + Log activity */
export async function POST(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (!verified)
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });

  try {
    const body = await req.json();
    const {
      film,
      url,
      genre = '',
      image_url = '',
      year = null,
      run_time = null,
      my_rating = null,
      screenwriters = '',
      producer = '',
      review = '',
      studio = '',
      director = '',
      tmdb_id = null,
      seenit = true,
    } = body;

    if (!film || !url) {
      return new Response(
        JSON.stringify({ message: 'film and url are required' }),
        { status: 400 }
      );
    }

    // ✅ Upsert movie details in allmovies (global)
    await sql`
      INSERT INTO allmovies (
        url, film, year, run_time, my_rating,
        screenwriters, producer, image_url, genre, review,
        studio, director, tmdb_id
      )
      VALUES (
        ${url}, ${film}, ${year}, ${run_time}, ${my_rating},
        ${screenwriters}, ${producer}, ${image_url}, ${genre}, ${review},
        ${studio}, ${director}, ${tmdb_id}
      )
      ON CONFLICT (url)
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

    // ✅ Upsert seenit status for this user
    await sql`
      INSERT INTO seenit (username, url, seenit)
      VALUES (${username}, ${url}, ${seenit})
      ON CONFLICT (username, url)
      DO UPDATE SET seenit = EXCLUDED.seenit;
    `;

    // 📝 Log activity
    await sql`
      INSERT INTO activity (user_id, username, movie_title, action, source)
      VALUES (${verified.id}, ${username}, ${film}, 'has seen', 'seenit');
    `;

    return new Response(
      JSON.stringify({ message: 'Movie marked as seen' }),
      { status: 201 }
    );
  } catch (err) {
    console.error('❌ Error in seenit POST:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}

/** 🔴 DELETE — Protected (unmark/remove movie) + Log activity */
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

    // 📝 Get film title before deleting
    const { rows } = await sql`
      SELECT film FROM allmovies WHERE url = ${url} LIMIT 1;
    `;
    const movie = rows[0];

    // ✅ Remove only the seenit entry (not the global movie)
    await sql`
      DELETE FROM seenit
      WHERE username = ${username} AND url = ${url};
    `;

    // 📝 Log activity if movie existed
    if (movie) {
      await sql`
        INSERT INTO activity (user_id, username, movie_title, action, source)
        VALUES (${verified.id}, ${username}, ${movie.film}, 'hasnt seen', 'seenit');
      `;
    }

    return new Response(
      JSON.stringify({ message: 'Movie removed from seen list' }),
      { status: 200 }
    );
  } catch (err) {
    console.error('❌ Error in seenit DELETE:', err);
    return new Response(JSON.stringify({ message: err.message }), { status: 500 });
  }
}
