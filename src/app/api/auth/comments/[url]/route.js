import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function DELETE(request) {
  const id = request.url.split('/').pop();
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401 }
    );
  }

  try {
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

    const commentResult = await sql`
      SELECT username
      FROM comments
      WHERE id = ${id};
    `;
    const comment = commentResult.rows[0];

    if (!comment || comment.userName !== user.username) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 403 }
      );
    }

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
