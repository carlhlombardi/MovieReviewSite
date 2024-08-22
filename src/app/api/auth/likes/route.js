import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
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
      SELECT SUM(likedCount) AS likecount
      FROM likes
      WHERE url = ${movieUrl} AND isliked = TRUE;
    `;
    const likeCount = parseInt(likeCountResult.rows[0].likecount || 0, 10);

    // Check if the user has liked the movie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ likeCount, isliked: false }),
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
      SELECT isliked
      FROM likes
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;
    const isLiked = isLikedResult.rowCount > 0 ? isLikedResult.rows[0].isliked : false;

    return new Response(
      JSON.stringify({ likeCount, isLiked }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ message: 'Failed to fetch likes' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    console.log('POST Request - URL:', url);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
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
    console.log('User Found:', user.username);

    // Check if the like already exists
    const existingLikeResult = await sql`
      SELECT isliked
      FROM likes
      WHERE username = ${user.username} AND url = ${url};
    `;
    const existingLike = existingLikeResult.rowCount > 0 ? existingLikeResult.rows[0].isliked : false;

    if (existingLike) {
      return new Response(
        JSON.stringify({ message: 'Item already liked' }),
        { status: 409 }
      );
    }

    // Insert or update like record and increment like count
    await sql`
      INSERT INTO likes (username, url, isliked, likedCount)
      VALUES (${user.username}, ${url}, TRUE, 1)
      ON CONFLICT (username, url) 
      DO UPDATE SET isliked = TRUE, likedCount = likedCount + 1
      RETURNING username, url;
    `;

    return new Response(
      JSON.stringify({ message: 'Item liked' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add like error:', error);  // Log full error
    return new Response(
      JSON.stringify({ message: 'Failed to add like' }),
      { status: 500 }
    );
  }
}


export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');
    console.log('DELETE Request - Movie URL:', movieUrl);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    if (!token || !movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized or missing movie URL' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
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

    // Check if the like exists
    const existingLikeResult = await sql`
      SELECT isliked
      FROM likes
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;
    const existingLike = existingLikeResult.rowCount > 0 ? existingLikeResult.rows[0].isliked : false;

    if (!existingLike) {
      return new Response(
        JSON.stringify({ message: 'Like not found or already unliked' }),
        { status: 404 }
      );
    }

    // Update like record and decrement like count
    await sql`
      UPDATE likes
      SET isliked = FALSE, likedCount = likedCount - 1
      WHERE username = ${user.username} AND url = ${movieUrl}
      RETURNING username, url;
    `;

    return new Response(
      JSON.stringify({ message: 'Like removed' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete like error:', error);  // Log full error
    return new Response(
      JSON.stringify({ message: 'Failed to remove like' }),
      { status: 500 }
    );
  }
}
