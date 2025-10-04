import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const urlObj = new URL(request.url);
    const movieUrl = urlObj.searchParams.get('url');

    if (!movieUrl) {
      return new Response(JSON.stringify({ message: 'Movie URL is required' }), { status: 400 });
    }

    // Total watch count using dynamic function
    const watchcountResult = await sql`SELECT get_movie_watchcount(${movieUrl}) AS watchcount;`;
    const watchcount = parseInt(watchcountResult.rows[0].watchcount ?? 0, 10);

    // Check auth
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(JSON.stringify({ watchcount, iswatched: false }), { status: 200 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`SELECT username FROM users WHERE id = ${userId};`;
    const user = userResult.rows[0];
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    }

    // User’s watch status
    const iswatchedResult = await sql`
      SELECT iswatched
      FROM wantedforcollection
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;
    const iswatched = iswatchedResult.rowCount > 0 ? iswatchedResult.rows[0].iswatched : false;

    return new Response(JSON.stringify({ watchcount, iswatched }), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ message: 'Failed to fetch watch status' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return new Response(JSON.stringify({ message: 'Movie URL is required' }), { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`SELECT username FROM users WHERE id = ${userId};`;
    const user = userResult.rows[0];
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    }

    // Dynamically fetch movie from any table
    const movieResult = await sql`SELECT * FROM get_movie_details(${url});`;
    const movie = movieResult.rows[0];
    if (!movie) {
      return new Response(JSON.stringify({ message: 'Movie not found' }), { status: 404 });
    }

    const title = movie.film;
    const genre = movie.genre;
    const image_url = movie.image_url;

    // Insert or update wantedforcollection
    await sql`
      INSERT INTO wantedforcollection (username, url, title, genre, iswatched, watchcount, image_url)
      VALUES (${user.username}, ${url}, ${title}, ${genre}, TRUE, 1, ${image_url})
      ON CONFLICT (username, url) DO UPDATE 
        SET iswatched = EXCLUDED.iswatched,
            watchcount = CASE 
              WHEN wantedforcollection.iswatched = TRUE AND EXCLUDED.iswatched = FALSE THEN wantedforcollection.watchcount - 1
              WHEN wantedforcollection.iswatched = FALSE AND EXCLUDED.iswatched = TRUE THEN wantedforcollection.watchcount + 1
              ELSE wantedforcollection.watchcount
            END;
    `;

    return new Response(JSON.stringify({ message: 'Item watched' }), { status: 201 });
  } catch (error) {
    console.error('Add watch error:', error);
    return new Response(JSON.stringify({ message: 'Failed to add watch' }), { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const urlObj = new URL(request.url);
    const movieUrl = urlObj.searchParams.get('url');
    if (!movieUrl) {
      return new Response(JSON.stringify({ message: 'Movie URL is required' }), { status: 400 });
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`SELECT username FROM users WHERE id = ${userId};`;
    const user = userResult.rows[0];
    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    }

    const deleteResult = await sql`
      UPDATE wantedforcollection
      SET iswatched = FALSE
      WHERE username = ${user.username} AND url = ${movieUrl}
      RETURNING username, url;
    `;
    if (deleteResult.rowCount === 0) {
      return new Response(JSON.stringify({ message: 'Watch not found' }), { status: 404 });
    }

    return new Response(JSON.stringify({ message: 'Watch removed' }), { status: 200 });
  } catch (error) {
    console.error('Delete watch error:', error);
    return new Response(JSON.stringify({ message: 'Failed to remove watch' }), { status: 500 });
  }
}
