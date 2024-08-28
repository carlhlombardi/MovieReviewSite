import { sql } from '@vercel/postgres'; // Ensure @vercel/postgres is correctly installed and configured
import jwt from 'jsonwebtoken';

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

    const { url, title, genre } = await request.json();
    if (!url || !title || !genre) {
      return new Response(
        JSON.stringify({ message: 'URL, title, and genre are required' }),
        { status: 400 }
      );
    }

    // Add movie to watchlist
    await sql`
      INSERT INTO watchlist (username, url, title, genre)
      VALUES (${username}, ${url}, ${title}, ${genre})
      ON CONFLICT (username, url) DO NOTHING;
    `;

    return new Response(
      JSON.stringify({ message: 'Movie added to watchlist' }),
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

    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
      return new Response(
        JSON.stringify({ message: 'URL is required' }),
        { status: 400 }
      );
    }

    // Remove movie from watchlist
    await sql`
      DELETE FROM watchlist
      WHERE username = ${username} AND url = ${url};
    `;

    return new Response(
      JSON.stringify({ message: 'Movie removed from watchlist' }),
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
      SELECT url, title, genre, iswatched
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
