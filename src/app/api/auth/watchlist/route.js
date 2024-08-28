import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

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
        watchlistItem: { username, url, title, genre },
        watchlistCount: (await sql`SELECT COUNT(*) FROM watchlist WHERE username = ${username}`).rows[0].count
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
