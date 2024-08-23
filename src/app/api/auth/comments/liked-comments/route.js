import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Handler to fetch liked comments for the current user
export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;

    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Fetch liked comment IDs for the user
    const likedComments = await sql`
      SELECT comment_id
      FROM liked_comments
      WHERE user_id = ${userId}
    `;

    // Fetch details of liked comments
    const commentIds = likedComments.rows.map(row => row.comment_id);
    const comments = commentIds.length > 0 ? await sql`
      SELECT id, username, text, createdat
      FROM comments
      WHERE id IN (${sql.join(commentIds, ',')})
    ` : [];

    return new Response(
      JSON.stringify(comments.rows),
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch liked comments error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch liked comments' }),
      { status: 500 }
    );
  }
}

// Handler to like a comment
export async function POST(request) {
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
      // If already liked, return a response indicating this
      return new Response(
        JSON.stringify({ likedByUser: true }),
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
    console.error('Like comment error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to like comment' }),
      { status: 500 }
    );
  }
}

// Handler to unlike a comment
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const commentId = url.searchParams.get('commentId');
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
      // If not liked, return a response indicating this
      return new Response(
        JSON.stringify({ likedByUser: false }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Unlike comment error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to unlike comment' }),
      { status: 500 }
    );
  }
}
