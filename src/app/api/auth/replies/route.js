import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { commentId, text } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;

    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    if (!commentId || !text) {
      return new Response(
        JSON.stringify({ message: 'Comment ID and text are required' }),
        { status: 400 }
      );
    }

    const userData = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId}
    `;
    const username = userData.rows[0]?.username;

    await sql`
      INSERT INTO replies (comment_id, user_id, username, text)
      VALUES (${commentId}, ${userId}, ${username}, ${text})
    `;

    return new Response(
      JSON.stringify({ message: 'Reply added successfully' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Reply error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add reply' }),
      { status: 500 }
    );
  }
}

export async function GET(request) {
    try {
      const url = new URL(request.url);
      const commentId = url.searchParams.get('commentId');
  
      if (!commentId) {
        return new Response(
          JSON.stringify({ message: 'Comment ID is required' }),
          { status: 400 }
        );
      }
  
      const replies = await sql`
        SELECT id, username, text, createdat
        FROM replies
        WHERE comment_id = ${commentId}
        ORDER BY createdat ASC
      `;
  
      return new Response(
        JSON.stringify(replies.rows),
        { status: 200 }
      );
    } catch (error) {
      console.error('Fetch replies error:', error);
      return new Response(
        JSON.stringify({ message: 'Failed to fetch replies' }),
        { status: 500 }
      );
    }
  }