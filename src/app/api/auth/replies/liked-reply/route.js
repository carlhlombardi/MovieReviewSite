import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { replyId } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;

    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    if (!replyId) {
      return new Response(
        JSON.stringify({ message: 'Reply ID is required' }),
        { status: 400 }
      );
    }

    // Check if the user has already liked this reply
    const existingLike = await sql`
      SELECT 1 FROM reply_likes WHERE reply_id = ${replyId} AND user_id = ${userId}
    `;
    
    if (existingLike.rows.length > 0) {
      // User has already liked this reply, so unlike it
      await sql`
        DELETE FROM reply_likes WHERE reply_id = ${replyId} AND user_id = ${userId}
      `;
      return new Response(
        JSON.stringify({ likedByUser: false }),
        { status: 200 }
      );
    } else {
      // User has not liked this reply yet, so like it
      await sql`
        INSERT INTO reply_likes (reply_id, user_id)
        VALUES (${replyId}, ${userId})
      `;
      return new Response(
        JSON.stringify({ likedByUser: true }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Like/Unlike reply error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to process like/unlike' }),
      { status: 500 }
    );
  }
}
