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

    // Get the total count of watchlist entries for the movie
    const watchlistCountResult = await sql`
      SELECT COUNT(*) AS watchlistCount
      FROM watchlist
      WHERE url = ${movieUrl};
    `;
    const watchlistCount = parseInt(watchlistCountResult.rows[0].watchlistCount, 10);

    // Check if the user has the movie in their watchlist
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ watchlistCount, isInWatchlist: false }),
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

    const isInWatchlistResult = await sql`
      SELECT EXISTS (
        SELECT 1
        FROM watchlist
        WHERE username = ${user.username} AND url = ${movieUrl}
      ) AS isInWatchlist;
    `;
    const isInWatchlist = isInWatchlistResult.rows[0].isInWatchlist;

    return new Response(
      JSON.stringify({ watchlistCount, isInWatchlist }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch watchlist status:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch watchlist status' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
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

    // Check if the movie exists in any of the tables
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
      INSERT INTO watchlist (username, url, title, genre)
      VALUES (${user.username}, ${url}, ${title}, ${genre})
      ON CONFLICT (username, url) DO NOTHING
      RETURNING username, url, title, genre;
    `;

    if (postResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Item already in watchlist' }),
        { status: 409 }
      );
    }

    // Count the total items in the watchlist for the user
    const watchlistCountResult = await sql`
      SELECT COUNT(*) AS count
      FROM watchlist
      WHERE username = ${user.username};
    `;
    const watchlistCount = watchlistCountResult.rows[0].count;

    return new Response(
      JSON.stringify({ message: 'Item added to watchlist', watchlistCount }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add to watchlist error:', safeStringify(error)); // Use safeStringify to avoid circular references
    return new Response(
      JSON.stringify({ message: 'Failed to add to watchlist' }),
      { status: 500 }
    );
  }
}


export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
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

    const deleteResult = await sql`
      DELETE FROM watchlist
      WHERE username = ${user.username} AND url = ${movieUrl}
      RETURNING username, url;
    `;

    if (deleteResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Item not found in watchlist' }),
        { status: 404 }
      );
    }

    // Count the total items in the watchlist for the user
    const watchlistCountResult = await sql`
      SELECT COUNT(*) AS count
      FROM watchlist
      WHERE username = ${user.username};
    `;
    const watchlistCount = watchlistCountResult.rows[0].count;

    return new Response(
      JSON.stringify({ message: 'Item removed from watchlist', watchlistCount }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove from watchlist error:', safeStringify(error)); // Use safeStringify to avoid circular references
    return new Response(
      JSON.stringify({ message: 'Failed to remove from watchlist' }),
      { status: 500 }
    );
  }
}