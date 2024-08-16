import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function DELETE(request) {
  try {
    // Extract the comment ID and movie URL from the query parameters
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
      SELECT username, url
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
