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

// Helper function to check if a movie is liked
const isMovieLiked = async (username, url) => {
  const result = await sql`
    SELECT 1
    FROM likes
    WHERE username = ${username} AND url = ${url};
  `;
  return result.rowCount > 0;
}

// Handler for the `/api/auth/liked` route
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
      case 'POST':
        // Toggle like status or fetch status
        const { url, action } = await request.json();
        if (!url) {
          return new Response(
            JSON.stringify({ message: 'URL is required' }),
            { status: 400 }
          );
        }

        if (action === 'status') {
          // Fetch like status
          const liked = await isMovieLiked(user.username, url);
          return new Response(
            JSON.stringify({
              isLiked: liked,
            }),
            { status: 200 }
          );
        }

        if (action === 'like') {
          // Add a like
          const postResult = await sql`
            INSERT INTO likes (username, email, url)
            VALUES (${user.username}, ${user.email}, ${url})
            ON CONFLICT (username, url) DO NOTHING
            RETURNING username, email, url;
          `;

          if (postResult.rowCount === 0) {
            return new Response(
              JSON.stringify({ message: 'Item already liked' }),
              { status: 409 }
            );
          }

          // Return the status after adding
          return new Response(
            JSON.stringify({
              message: 'Item liked',
              isLiked: true,
            }),
            { status: 201 }
          );
        } else if (action === 'unlike') {
          // Remove a like
          const deleteResult = await sql`
            DELETE FROM likes
            WHERE username = ${user.username} AND url = ${url}
            RETURNING username, email, url;
          `;

          if (deleteResult.rowCount === 0) {
            return new Response(
              JSON.stringify({ message: 'Item not found in liked list' }),
              { status: 404 }
            );
          }

          // Return the status after removing
          return new Response(
            JSON.stringify({
              message: 'Item unliked',
              isLiked: false,
            }),
            { status: 200 }
          );
        }

        break;

      default:
        return new Response(
          JSON.stringify({ message: 'Method not allowed' }),
          { status: 405 }
        );
    }
  } catch (error) {
    console.error('Error handling liked request:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to process request' }),
      { status: 500 }
    );
  }
}
