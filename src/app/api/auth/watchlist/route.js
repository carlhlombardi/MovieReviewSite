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

    // Extract URL from the request body
    const { url } = await request.json();

    if (!url) {
      return new Response(
        JSON.stringify({ message: 'URL is required' }),
        { status: 400 }
      );
    }

    // Get movie details from the relevant table
    const movieDetails = await getMovieDetailsByURL(url);

    if (!movieDetails) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    const { title, genre } = movieDetails;

    // Insert the movie into the watchlist
    await sql`
      INSERT INTO watchlist (username, url, title, genre)
      VALUES (${username}, ${url}, ${title}, ${genre})
      ON CONFLICT (username, url) DO NOTHING;
    `;

    // Get updated watchlist count
    const watchlistCountResult = await sql`
      SELECT COUNT(*) AS count
      FROM watchlist
      WHERE username = ${username}
    `;
    const watchlistCount = parseInt(watchlistCountResult.rows[0].count, 10);

    return new Response(
      JSON.stringify({ 
        message: 'Movie added to watchlist', 
        watchlistItem: { username, url, title, genre },
        watchlistCount
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
