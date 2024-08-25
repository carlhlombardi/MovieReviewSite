import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { replyId, text, commentId } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    
    // Verify the token and extract userId
    const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;

    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    if (!replyId || !text || !commentId) {
      return new Response(
        JSON.stringify({ message: 'Reply ID, comment ID, and text are required' }),
        { status: 400 }
      );
    }

    // Fetch the username of the user who is replying
    const userData = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId}
    `;
    
    if (userData.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }
    
    const username = userData.rows[0]?.username;

    // Insert the new reply
    const result = await sql`
      INSERT INTO replies (parent_reply_id, comment_id, user_id, username, text)
      VALUES (${replyId}, ${commentId}, ${userId}, ${username}, ${text})
      RETURNING id, parent_reply_id, comment_id, user_id, username, text, createdat
    `;

    return new Response(
      JSON.stringify(result.rows[0]),
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

