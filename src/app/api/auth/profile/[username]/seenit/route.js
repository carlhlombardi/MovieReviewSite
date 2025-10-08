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

/** 🟡 GET — Public (fetch seen movies) */
export async function GET(req, { params }) {
  const { username } = params;

  try {
    const { rows } = await sql`
      SELECT id, title, genre, image_url, url, seenit, created_at
      FROM seenit
      WHERE username = ${username} AND seenit = TRUE
      ORDER BY created_at DESC;
    `;

    return new Response(
      JSON.stringify({ movies: rows, total: rows.length }),
      { status: 200 }
    );
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
      title,
      genre = '',
      image_url = '',
      url,
      seenit = true,
    } = body;

    if (!title || !url) {
      return new Response(
        JSON.stringify({ message: 'title and url are required' }),
        { status: 400 }
      );
    }

    // ✅ Add or update seen movie
    await sql`
      INSERT INTO seenit (username, url, title, genre, seenit, image_url)
      VALUES (${username}, ${url}, ${title}, ${genre}, ${seenit}, ${image_url})
      ON CONFLICT (username, url)
      DO UPDATE SET
        title = EXCLUDED.title,
        genre = EXCLUDED.genre,
        image_url = EXCLUDED.image_url,
        seenit = EXCLUDED.seenit;
    `;

    // 📝 Log activity (now includes username)
    await sql`
      INSERT INTO activity (user_id, username, movie_title, action, source)
      VALUES (${verified.id}, ${username}, ${title}, 'has seen', 'seenit');
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
      return new Response(JSON.stringify({ message: 'url is required' }), { status: 400 });
    }

    // 📝 Get movie title before deleting
    const { rows } = await sql`
      SELECT title FROM seenit
      WHERE username = ${username} AND url = ${url}
      LIMIT 1;
    `;
    const movie = rows[0];

    // ✅ Delete from seenit
    await sql`
      DELETE FROM seenit
      WHERE username = ${username} AND url = ${url};
    `;

    // 📝 Log activity (includes username)
    if (movie) {
      await sql`
        INSERT INTO activity (user_id, username, movie_title, action, source)
        VALUES (${verified.id}, ${username}, ${movie.title}, 'hasnt seen', 'seenit');
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
