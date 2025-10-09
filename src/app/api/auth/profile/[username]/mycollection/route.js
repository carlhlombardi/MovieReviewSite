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

/** ✅ GET: Public — Fetch user's liked movies */
export async function GET(req, { params }) {
  const { username } = params;
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const { rows } = await sql`
      SELECT a.id, a.film, a.year, a.run_time, a.my_rating, a.screenwriters, 
             a.producer, a.image_url, a.genre, a.review, a.studio, a.director, 
             a.tmdb_id, a.url, m.isliked, m.likedcount
      FROM allmovies a
      JOIN mycollection m ON a.url = m.url
      WHERE m.username = ${username} AND m.isliked = TRUE
      ORDER BY a.film
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

/** ✅ POST: Protected — Add or update movie in collection */
export async function POST(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (!verified) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      film,
      genre,
      image_url,
      url,
      year = null,
      run_time = null,
      my_rating = null,
      screenwriters = null,
      producer = null,
      review = null,
      studio = null,
      director = null,
      tmdb_id = null,
      isliked = true,
      likedcount = 0,
    } = body;

    if (!film || !genre || !url) {
      return new Response(
        JSON.stringify({ message: 'film, genre and url are required' }),
        { status: 400 }
      );
    }

    // 📝 Upsert movie in allmovies (no username column here)
    await sql`
      INSERT INTO allmovies (url, film, year, run_time, my_rating, screenwriters, producer, image_url, genre, review, studio, director, tmdb_id)
      VALUES (${url}, ${film}, ${year}, ${run_time}, ${my_rating}, ${screenwriters}, ${producer}, ${image_url}, ${genre}, ${review}, ${studio}, ${director}, ${tmdb_id})
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

    // 📝 Upsert user relationship in mycollection
    await sql`
      INSERT INTO mycollection (username, url, isliked, likedcount)
      VALUES (${username}, ${url}, ${isliked}, ${likedcount})
      ON CONFLICT (username, url)
      DO UPDATE SET
        isliked = EXCLUDED.isliked,
        likedcount = EXCLUDED.likedcount;
    `;

    // 🟢 Log activity
    await sql`
      INSERT INTO activity (user_id, username, movie_title, action, source)
      VALUES (${verified.id}, ${username}, ${film}, 'has', 'mycollection');
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

/** ✅ DELETE: Protected — Remove movie from collection */
export async function DELETE(req, { params }) {
  const { username } = params;
  const verified = await verifyUser(req, username);
  if (!verified) {
    return new Response(JSON.stringify({ message: 'Forbidden' }), { status: 403 });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(
        JSON.stringify({ message: 'url is required' }),
        { status: 400 }
      );
    }

    // 📝 Get film title before removal for activity log
    const { rows } = await sql`
      SELECT film FROM allmovies
      WHERE url = ${url}
      LIMIT 1;
    `;
    const movie = rows[0];

    // ❌ Remove link from mycollection (not from allmovies)
    await sql`
      DELETE FROM mycollection
      WHERE username = ${username} AND url = ${url};
    `;

    // 📝 Log activity
    if (movie) {
      await sql`
        INSERT INTO activity (user_id, username, movie_title, action, source)
        VALUES (${verified.id}, ${username}, ${movie.film}, 'doesnt have', 'mycollection');
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
