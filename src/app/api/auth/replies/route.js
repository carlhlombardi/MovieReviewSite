import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    // Log the request headers and body
    console.log('Request headers:', request.headers);
    const requestBody = await request.json();
    console.log('Request body:', requestBody);

    // Parse the request body
    const { commentId, text } = requestBody;
    
    // Extract and verify the token
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;

    // Check if userId is valid
    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate input
    if (!commentId || !text) {
      return new Response(
        JSON.stringify({ message: 'Comment ID and text are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the username from the database
    const userData = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId}
    `;
    const username = userData.rows[0]?.username;

    // Insert the new reply and return the inserted reply
    const result = await sql`
      INSERT INTO replies (comment_id, user_id, username, text)
      VALUES (${commentId}, ${userId}, ${username}, ${text})
      RETURNING id, comment_id, user_id, username, text, createdat
    `;

    // Return the newly inserted reply
    return new Response(
      JSON.stringify(result.rows[0]),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Reply error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add reply' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
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