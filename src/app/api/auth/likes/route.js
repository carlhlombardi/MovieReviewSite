import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Function to get user details from the Users table
const getUserDetails = async (id) => {
  const userResult = await sql`
    SELECT username, email
    FROM users
    WHERE id = ${id};
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
};

// Helper function to get the total like count for a specific movie URL
const getLikeCount = async (url) => {
  const result = await sql`
    SELECT COUNT(*) AS likeCount
    FROM likes
    WHERE url = ${url};
  `;
  return result.rows[0].likeCount;
};

// Handler for the `/api/auth/likes` route
export async function handler(request) {
  try {
    if (request.method === 'GET') {
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

      // Parse query parameters
      const url = new URL(request.url).searchParams.get('url');
      if (!url) {
        return new Response(
          JSON.stringify({ message: 'URL is required' }),
          { status: 400 }
        );
      }

      // Determine the response data
      const isLiked = await isMovieLiked(user.username, url);
      const likeCount = await getLikeCount(url);

      return new Response(
        JSON.stringify({ isLiked, likeCount }),
        { status: 200 }
      );

    } else if (request.method === 'POST') {
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

      // Parse request body
      const { url, action } = await request.json();
      if (!url) {
        return new Response(
          JSON.stringify({ message: 'URL is required' }),
          { status: 400 }
        );
      }

      // Determine the response data
      let isLiked = false;
      let likeCount = 0;

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
            JSON.stringify({ message: 'Item already liked', isLiked: true, likeCount: await getLikeCount(url) }),
            { status: 409 }
          );
        }

        // Return the status after adding
        isLiked = true;
        likeCount = await getLikeCount(url);
        return new Response(
          JSON.stringify({
            message: 'Item liked',
            isLiked,
            likeCount,
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
            JSON.stringify({ message: 'Item not found in liked list', isLiked: false, likeCount: await getLikeCount(url) }),
            { status: 404 }
          );
        }

        // Return the status after removing
        isLiked = false;
        likeCount = await getLikeCount(url);
        return new Response(
          JSON.stringify({
            message: 'Item unliked',
            isLiked,
            likeCount,
          }),
          { status: 200 }
        );
      }

    } else {
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
