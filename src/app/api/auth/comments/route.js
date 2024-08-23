import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Handler to get comments for a specific movie with like status
export async function GET(request) {
  try {
    // Extract URL from query parameters
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    // Fetch comments for the movie
    const result = await sql`
      SELECT id, username, text, createdat
      FROM comments
      WHERE url = ${movieUrl}
      ORDER BY createdat DESC;
    `;

    let comments = result.rows;

    if (userId) {
      // Fetch liked comments for the current user
      const likedComments = await sql`
        SELECT comment_id
        FROM liked_comments
        WHERE user_id = ${userId}
      `;

      const likedCommentIds = likedComments.rows.map(row => row.comment_id);

      // Map comments to include like status
      comments = comments.map(comment => ({
        ...comment,
        likedByUser: likedCommentIds.includes(comment.id)
      }));
    }

    return new Response(
      JSON.stringify(comments),
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch comments error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch comments' }),
      { status: 500 }
    );
  }
}

// Handler to add a new comment
export async function POST(request) {
  try {
    const { url, text } = await request.json();
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

    const result = await sql`
      INSERT INTO comments (url, username, text, createdat)
      VALUES (${url}, ${user.username}, ${text}, NOW())
      RETURNING id, username, text, createdat;
    `;

    return new Response(
      JSON.stringify(result.rows[0]),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add comment error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add comment' }),
      { status: 500 }
    );
  }
}

// Handler to delete a comment
export async function DELETE(request) {
  // Extract the query parameters
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const movieUrl = url.searchParams.get('url');

  if (!id || !movieUrl) {
    return new Response(
      JSON.stringify({ message: 'Comment ID and movie URL are required' }),
      { status: 400 }
    );
  }

  // Extract the authorization token from the headers
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401 }
    );
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Retrieve the username associated with the token
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

    // Retrieve the comment to ensure it belongs to the user and matches the movie URL
    const commentResult = await sql`
      SELECT username
      FROM comments
      WHERE id = ${id}
      AND url = ${movieUrl};
    `;
    const comment = commentResult.rows[0];

    if (!comment) {
      return new Response(
        JSON.stringify({ message: 'Comment not found' }),
        { status: 404 }
      );
    }

    if (comment.username !== user.username) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 403 }
      );
    }

    // Delete the comment from the database
    await sql`
      DELETE FROM comments
      WHERE id = ${id};
    `;

    // Optionally delete likes associated with the comment
    await sql`
      DELETE FROM liked_comments
      WHERE comment_id = ${id};
    `;

    return new Response(
      JSON.stringify({ message: 'Comment deleted' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete comment error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to delete comment' }),
      { status: 500 }
    );
  }
}

// Handler to like or unlike a comment
export async function POST_LIKE(request) {
  try {
    const { commentId } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;

    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    if (!commentId) {
      return new Response(
        JSON.stringify({ message: 'Comment ID is required' }),
        { status: 400 }
      );
    }

    // Check if the comment is already liked
    const existingLike = await sql`
      SELECT 1
      FROM liked_comments
      WHERE user_id = ${userId}
        AND comment_id = ${commentId}
    `;

    if (existingLike.rowCount > 0) {
      // If already liked, unlike the comment
      await sql`
        DELETE FROM liked_comments
        WHERE user_id = ${userId}
          AND comment_id = ${commentId}
      `;
      return new Response(
        JSON.stringify({ likedByUser: false }),
        { status: 200 }
      );
    } else {
      // Otherwise, like the comment
      await sql`
        INSERT INTO liked_comments (user_id, comment_id)
        VALUES (${userId}, ${commentId})
      `;
      return new Response(
        JSON.stringify({ likedByUser: true }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Like/unlike comment error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to like/unlike comment' }),
      { status: 500 }
    );
  }
}