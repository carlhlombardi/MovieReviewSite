import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

const getMovieDetailsByURL = async (url) => {
  const tables = [
    'comedymovies', 'horrormovies', 'dramamovies', 'classicmovies', 
    'documentarymovies', 'actionmovies', 'scifimovies'
  ];

  for (const table of tables) {
    const result = await sql`
      SELECT title, genre
      FROM ${sql(table)}
      WHERE url = ${url};
    `;

    if (result.rowCount > 0) {
      return result.rows[0];
    }
  }

  return null; // URL not found in any table
};

// POST request to add a movie to the watchlist
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

    // Query the different movie tables to find the movie details
    let movieResult = await sql`
      SELECT title, genre
      FROM horrormovies
      WHERE url = ${url}
      UNION ALL
      SELECT title, genre
      FROM scifimovies
      WHERE url = ${url}
      UNION ALL
      SELECT title, genre
      FROM comedymovies
      WHERE url = ${url}
      UNION ALL
      SELECT title, genre
      FROM actionmovies
      WHERE url = ${url}
      UNION ALL
      SELECT title, genre
      FROM documentarymovies
      WHERE url = ${url}
      UNION ALL
      SELECT title, genre
      FROM classicmovies
      WHERE url = ${url}
      UNION ALL
      SELECT title, genre
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

    const title = movie.title;  // Assuming column name in tables is 'title'
    const genre = movie.genre;  // Assuming column name in tables is 'genre'

    // Insert or update the watchlist table with username, url, and movie details
    const postResult = await sql`
      INSERT INTO watchlist (username, url, title, genre)
      VALUES (${user.username}, ${url}, ${title}, ${genre})
      ON CONFLICT (username, url) DO NOTHING
      RETURNING username, url, title, genre;
    `;
    console.log('POST Result:', postResult);

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
      JSON.stringify({ 
        message: 'Item added to watchlist', 
        watchlistCount 
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add to watchlist error:', error);  // Log full error
    return new Response(
      JSON.stringify({ message: 'Failed to add to watchlist' }),
      { status: 500 }
    );
  }
}


export async function GET(request) {
  try {
    // Retrieve the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Authorization token is missing' }),
        { status: 401 }
      );
    }

    // Verify the token and decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract username from decoded token
    const username = decoded.username;

    if (!username) {
      return new Response(
        JSON.stringify({ message: 'Username not found in token' }),
        { status: 401 }
      );
    }

    // Fetch the watchlist for the user
    const watchlistResult = await sql`
      SELECT username, url, title, genre
      FROM watchlist
      WHERE username = ${username};
    `;

    const watchlist = watchlistResult.rows;

    return new Response(
      JSON.stringify({ watchlist }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch watchlist:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch watchlist' }),
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // Retrieve the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Authorization token is missing' }),
        { status: 401 }
      );
    }

    // Verify the token and decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract username from decoded token
    const username = decoded.username;

    if (!username) {
      return new Response(
        JSON.stringify({ message: 'Username not found in token' }),
        { status: 401 }
      );
    }

    // Extract URL from the query parameters
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return new Response(
        JSON.stringify({ message: 'URL is required' }),
        { status: 400 }
      );
    }

    // Remove the movie from the watchlist
    const result = await sql`
      DELETE FROM watchlist
      WHERE username = ${username} AND url = ${url}
      RETURNING username, url, title, genre;
    `;

    if (result.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Movie not found in watchlist' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Movie removed from watchlist', 
        watchlistItem: result.rows[0] 
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to remove movie from watchlist:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to remove movie from watchlist' }),
      { status: 500 }
    );
  }
}
