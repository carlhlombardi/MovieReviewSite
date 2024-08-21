import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Handler for the `/watchlist` route
export async function handler(request) {
  try {
    // Extract user ID from token
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

    switch (request.method) {
      case 'GET':
        // Get watchlisted movies for the user, including user details and movie details
        const getResult = await sql`
          SELECT w.user_id, u.username, u.email, w.movie_id, m.genre
          FROM watchlist w
          JOIN "user" u ON w.user_id = u.id
          JOIN movie m ON w.movie_id = m.id
          WHERE w.user_id = ${userId};
        `;

        if (getResult.rows.length === 0) {
          return new Response(
            JSON.stringify({ message: 'No watchlisted movies found' }),
            { status: 404 }
          );
        }

        return new Response(
          JSON.stringify(getResult.rows),
          { status: 200 }
        );

      case 'POST':
        // Add a movie to the watchlist
        const { movie_id, genre } = await request.json();
        if (!movie_id || !genre) {
          return new Response(
            JSON.stringify({ message: 'Movie ID and genre are required' }),
            { status: 400 }
          );
        }

        const postResult = await sql`
          INSERT INTO watchlist (user_id, movie_id, genre)
          VALUES (${userId}, ${movie_id}, ${genre})
          ON CONFLICT (user_id, movie_id, genre) DO NOTHING
          RETURNING user_id, movie_id, genre;
        `;

        if (postResult.rows.length === 0) {
          return new Response(
            JSON.stringify({ message: 'Movie already in watchlist' }),
            { status: 409 }
          );
        }

        return new Response(
          JSON.stringify(postResult.rows[0]),
          { status: 201 }
        );

      case 'DELETE':
        // Remove a movie from the watchlist
        const url = new URL(request.url);
        const movie_id_del = url.searchParams.get('movie_id');
        const genre_del = url.searchParams.get('genre');

        if (!movie_id_del || !genre_del) {
          return new Response(
            JSON.stringify({ message: 'Movie ID and genre are required' }),
            { status: 400 }
          );
        }

        const deleteResult = await sql`
          DELETE FROM watchlist
          WHERE user_id = ${userId} AND movie_id = ${movie_id_del} AND genre = ${genre_del}
          RETURNING user_id, movie_id, genre;
        `;

        if (deleteResult.rowCount === 0) {
          return new Response(
            JSON.stringify({ message: 'Movie not found in watchlist' }),
            { status: 404 }
          );
        }

        return new Response(
          JSON.stringify({ message: 'Movie removed from watchlist' }),
          { status: 200 }
        );

      default:
        return new Response(
          JSON.stringify({ message: 'Method not allowed' }),
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Watchlist operation error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to process request' }),
      { status: 500 }
    );
  }
}
