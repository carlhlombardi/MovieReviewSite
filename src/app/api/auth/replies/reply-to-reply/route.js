import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function POST(request) {
    try {
      const { replyId, text, commentId } = await request.json();
      console.log('POST request payload:', { replyId, text, commentId });
  
      const authHeader = request.headers.get('Authorization');
      const token = authHeader?.split(' ')[1];
      console.log('Authorization token:', token);
  
      const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;
      console.log('User ID:', userId);
  
      if (!userId) {
        console.log('Unauthorized user');
        return new Response(
          JSON.stringify({ message: 'Unauthorized' }),
          { status: 401 }
        );
      }
  
      if (!replyId || !text || !commentId) {
        console.log('Missing required fields:', { replyId, text, commentId });
        return new Response(
          JSON.stringify({ message: 'Reply ID, comment ID, and text are required' }),
          { status: 400 }
        );
      }
  
      const userData = await sql`
        SELECT username
        FROM users
        WHERE id = ${userId}
      `;
      console.log('User data:', userData);
  
      if (userData.rowCount === 0) {
        console.log('User not found:', userId);
        return new Response(
          JSON.stringify({ message: 'User not found' }),
          { status: 404 }
        );
      }
      
      const username = userData.rows[0]?.username;
      console.log('Username found:', username);
  
      const result = await sql`
        INSERT INTO replies (parent_reply_id, comment_id, user_id, username, text)
        VALUES (${replyId}, ${commentId}, ${userId}, ${username}, ${text})
        RETURNING id, parent_reply_id, comment_id, user_id, username, text, createdat
      `;
      console.log('Reply inserted:', result.rows[0]);
  
      return new Response(
        JSON.stringify(result.rows[0]),
        { status: 201 }
      );
    } catch (error) {
      console.error('Reply error:', error.message);
      return new Response(
        JSON.stringify({ message: 'Failed to add reply' }),
        { status: 500 }
      );
    }
  }