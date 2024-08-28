import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Helper function to check multiple tables
const getMovieDetailsByURL = async (url) => {
  const tables = [
    'actionmovies', 'comedymovies', 'classicmovies', 
    'horrormovies', 'dramamovies', 'documentarymovies', 
    'scifimovies'
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
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Authorization token is missing' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.username;

    if (!username) {
      return new Response(
        JSON.stringify({ message: 'Username not found in token' }),
        { status: 401 }
      );
    }

    const { url } = await request.json();
    if (!url) {
      return new Response(
        JSON.stringify({ message: 'URL is required' }),
        { status: 400 }
      );
    }

    const movieDetails = await getMovieDetailsByURL(url);

    if (!movieDetails) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    const { title, genre } = movieDetails;

    await sql`
      INSERT INTO watchlist (username, url, title, genre)
      VALUES (${username}, ${url}, ${title}, ${genre})
      ON CONFLICT (username, url) DO NOTHING;
    `;

    return new Response(
      JSON.stringify({ 
        message: 'Movie added to watchlist', 
        watchlistItem: { username, url, title, genre } 
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to add movie to watchlist:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add movie to watchlist' }),
      { status: 500 }
    );
  }
}

// GET request to fetch watchlist
export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Authorization token is missing' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.username;

    if (!username) {
      return new Response(
        JSON.stringify({ message: 'Username not found in token' }),
        { status: 401 }
      );
    }

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

// DELETE request to remove a movie from the watchlist
export async function DELETE(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Authorization token is missing' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const username = decoded.username;

    if (!username) {
      return new Response(
        JSON.stringify({ message: 'Username not found in token' }),
        { status: 401 }
      );
    }

    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return new Response(
        JSON.stringify({ message: 'URL is required' }),
        { status: 400 }
      );
    }

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
