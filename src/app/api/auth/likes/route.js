import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Handler to get likes for a specific movie
export async function GET(request) {
  try {
    // Extract URL from query parameters
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    // Get the total like count for the movie
    const likeCountResult = await sql`
      SELECT COUNT(*) AS likeCount
      FROM likes
      WHERE url = ${movieUrl};
    `;
    const likeCount = likeCountResult.rows[0].likeCount;

    // Check if the user has liked the movie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ likeCount, isLiked: false }),
        { status: 200 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    const isLikedResult = await sql`
      SELECT 1
      FROM likes
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;
    const isLiked = isLikedResult.rowCount > 0;

    return new Response(
      JSON.stringify({ likeCount, isLiked }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch likes error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch likes' }),
      { status: 500 }
    );
  }
}

// Handler to add a new like
export async function POST(request) {
  try {
    const { url } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('No token provided');
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    console.log('Decoded user ID:', userId);

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];

    if (!user) {
      console.log('User not found');
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    console.log('User found:', user.username);

    const postResult = await sql`
      INSERT INTO likes (username, url)
      VALUES (${user.username}, ${url})
      ON CONFLICT (username, url) DO NOTHING
      RETURNING username, url;
    `;

    if (postResult.rowCount === 0) {
      console.log('Item already liked');
      return new Response(
        JSON.stringify({ message: 'Item already liked' }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Item liked' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add like error:', error.message);
    return new Response(
      JSON.stringify({ message: 'Failed to add like' }),
      { status: 500 }
    );
  }
}


// Handler to delete a like
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized or missing movie URL' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
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

    const deleteResult = await sql`
      DELETE FROM likes
      WHERE username = ${user.username} AND url = ${movieUrl}
      RETURNING username, url;
    `;

    if (deleteResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Like not found' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Like removed' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete like error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to remove like' }),
      { status: 500 }
    );
  }
}