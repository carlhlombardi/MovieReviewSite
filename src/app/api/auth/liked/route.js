import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Function to get user details from the Users table
const getUserDetails = async (userId) => {
  const userResult = await sql`
    SELECT username, email
    FROM users
    WHERE id = ${userId};
  `;
  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }
  return userResult.rows[0];
};

// Handler for the `/likes` route
export async function handler(request) {
  try {
    // Extract the authorization token
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
        // Get liked items for the specific user
        const getResult = await sql`
          SELECT username, email, url
          FROM likes
          WHERE username = ${user.username};
        `;

        if (getResult.rows.length === 0) {
          return new Response(
            JSON.stringify({ message: 'No liked items found' }),
            { status: 404 }
          );
        }

        return new Response(
          JSON.stringify(getResult.rows),
          { status: 200 }
        );

      case 'POST':
        // Add a like to the list
        const { url } = await request.json();
        if (!url) {
          return new Response(
            JSON.stringify({ message: 'URL is required' }),
            { status: 400 }
          );
        }

        const postResult = await sql`
          INSERT INTO likes (username, email, url)
          VALUES (${user.username}, ${user.email}, ${url})
          ON CONFLICT (username, url) DO NOTHING
          RETURNING username, email, url;
        `;

        if (postResult.rows.length === 0) {
          return new Response(
            JSON.stringify({ message: 'Item already liked' }),
            { status: 409 }
          );
        }

        return new Response(
          JSON.stringify(postResult.rows[0]),
          { status: 201 }
        );

      case 'DELETE':
        // Remove a like from the list
        const urlToDelete = new URL(request.url);
        const url_del = urlToDelete.searchParams.get('url');

        if (!url_del) {
          return new Response(
            JSON.stringify({ message: 'URL is required' }),
            { status: 400 }
          );
        }

        const deleteResult = await sql`
          DELETE FROM likes
          WHERE username = ${user.username} AND url = ${url_del}
          RETURNING username, email, url;
        `;

        if (deleteResult.rowCount === 0) {
          return new Response(
            JSON.stringify({ message: 'Item not found in liked list' }),
            { status: 404 }
          );
        }

        return new Response(
          JSON.stringify({ message: 'Item removed from liked list' }),
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
