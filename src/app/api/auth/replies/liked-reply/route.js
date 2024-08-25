import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    // Parse JSON from request
    const { replyId } = await request.json();
    
    // Extract token from headers
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    
    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Token is required' }),
        { status: 401 }
      );
    }

    // Verify token and extract userId
    let userId;
    try {
      const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      userId = decodedToken.userId;
    } catch (err) {
      console.error('Token verification failed:', err);
      return new Response(
        JSON.stringify({ message: 'Invalid token' }),
        { status: 401 }
      );
    }
    
    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'User ID could not be extracted from token' }),
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
