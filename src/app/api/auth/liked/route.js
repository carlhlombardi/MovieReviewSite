import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Function to get user details from the Users table
const getUserDetails = async (userId) => {
  const userResult = await sql`
    SELECT username, email
    FROM Users
    WHERE id = ${userId};
  `;
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  return userResult.rows[0];
};

// Handler for the `/liked` route
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

    // Fetch user details from the Users table
    const user = await getUserDetails(userId);

    switch (request.method) {
      case 'GET':
        // Get liked movies for the specific user
        const getResult = await sql`
          SELECT l.username, l.email, m.url, m.genre
          FROM liked l
          JOIN all_movies m ON l.url = m.url AND l.genre = m.genre
          WHERE l.username = ${user.username};
        `;

        if (getResult.rows.length === 0) {
          return new Response(
            JSON.stringify({ message: 'No liked movies found' }),
            { status: 404 }
          );
        }

        return new Response(
          JSON.stringify(getResult.rows),
          { status: 200 }
        );

      case 'POST':
        // Add a movie to the liked list
        const { url, genre } = await request.json();
        if (!url || !genre) {
          return new Response(
            JSON.stringify({ message: 'URL and genre are required' }),
            { status: 400 }
          );
        }

        const postResult = await sql`
          INSERT INTO liked (username, email, url, genre)
          VALUES (${user.username}, ${user.email}, ${url}, ${genre})
          ON CONFLICT (username, url, genre) DO NOTHING
          RETURNING username, email, url, genre;
        `;

        if (postResult.rows.length === 0) {
          return new Response(
            JSON.stringify({ message: 'Movie already liked' }),
            { status: 409 }
          );
        }

        return new Response(
          JSON.stringify(postResult.rows[0]),
          { status: 201 }
        );

      case 'DELETE':
        // Remove a movie from the liked list
        const urlToDelete = new URL(request.url);
        const url_del = urlToDelete.searchParams.get('url');
        const genre_del = urlToDelete.searchParams.get('genre');

        if (!url_del || !genre_del) {
          return new Response(
            JSON.stringify({ message: 'URL and genre are required' }),
            { status: 400 }
          );
        }

        const deleteResult = await sql`
          DELETE FROM liked
          WHERE username = ${user.username} AND url = ${url_del} AND genre = ${genre_del}
          RETURNING username, email, url, genre;
        `;

        if (deleteResult.rowCount === 0) {
          return new Response(
            JSON.stringify({ message: 'Movie not found in liked list' }),
            { status: 404 }
          );
        }

        return new Response(
          JSON.stringify({ message: 'Movie removed from liked list' }),
          { status: 200 }
        );

      default:
        return new Response(
          JSON.stringify({ message: 'Method not allowed' }),
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Liked list operation error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to process request' }),
      { status: 500 }
    );
  }
}
