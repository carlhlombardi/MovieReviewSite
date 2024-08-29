import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    // Get the total watch count for the movie across all tables
    const watchcountResult = await sql`
      SELECT COUNT(*) AS watchcount
      FROM (
        SELECT url FROM horrormovies
        UNION ALL
        SELECT url FROM scifimovies
        UNION ALL
        SELECT url FROM comedymovies
        UNION ALL
        SELECT url FROM actionmovies
        UNION ALL
        SELECT url FROM documentarymovies
        UNION ALL
        SELECT url FROM classicmovies
        UNION ALL
        SELECT url FROM dramamovies
      ) AS all_movies
      JOIN watchlist ON all_movies.url = watchlist.url
      WHERE watchlist.url = ${movieUrl} AND watchlist.iswatched = TRUE;
    `;
    const watchcount = parseInt(watchcountResult.rows[0].watchcount, 10);

    // Check if the user has watched the movie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ watchcount, iswatched: false }),
        { status: 200 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    const iswatchedResult = await sql`
      SELECT iswatched
      FROM watchlist
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;
    const iswatched = iswatchedResult.rowCount > 0 ? iswatchedResult.rows[0].iswatched : false;

    return new Response(
      JSON.stringify({ watchcount, iswatched }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Failed to fetch watchlist' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    console.log('POST Request - URL:', url);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    const userId = decoded.userId;

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }
    console.log('User Found:', user.username);

    // Query the different movie tables
    let movieResult = await sql`
      SELECT film, genre
      FROM horrormovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM scifimovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM comedymovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM actionmovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM documentarymovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM classicmovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM dramamovies
      WHERE url = ${url};
    `;

    let movie = movieResult.rows[0];

    if (!movie) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    const title = movie.film;
    const genre = movie.genre;

    // Insert or update the watchlist table with username, url, and title
    const postResult = await sql`
      INSERT INTO watchlist (username, url, title, genre, iswatched, watchcount)
      VALUES (${user.username}, ${url}, ${title}, ${genre}, TRUE, 1)
       ON CONFLICT (username, url) DO UPDATE 
        SET iswatched = EXCLUDED.iswatched,
          watchcount = CASE 
                    WHEN watchlist.iswatched = TRUE AND EXCLUDED.iswatched = FALSE THEN watchlist.watchcount - 1
                    WHEN watchlist.iswatched = FALSE AND EXCLUDED.iswatched = TRUE THEN watchlist.watchcount + 1
                    ELSE watchlist.watchedcount
                 END
        RETURNING username, url, title, genre, watchecount;
    `;

    if (postResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Item already watched' }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Item watched' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add watch error:', error);  // Log full error
    return new Response(
      JSON.stringify({ message: 'Failed to add watch' }),
      { status: 500 }
    );
  }
}


export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');
    console.log('DELETE Request - Movie URL:', movieUrl);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token || !movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized or missing movie URL' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
    const userId = decoded.userId;

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    const deleteResult = await sql`
      UPDATE watchlist
      SET iswatched = FALSE
      WHERE username = ${user.username} AND url = ${movieUrl}
      RETURNING username, url;
    `;
    console.log('DELETE Result:', deleteResult);

    if (deleteResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Watch not found' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Watch removed' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete watch error:', error);  // Log full error
    return new Response(
      JSON.stringify({ message: 'Failed to remove watch' }),
      { status: 500 }
    );
  }
}