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

    // Insert the new reply with the given parent_reply_id
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
  
      // Fetch top-level replies for the given commentId
      const replies = await sql`
        SELECT id, parent_reply_id, username, text, createdat
        FROM replies
        WHERE comment_id = ${commentId}
        ORDER BY createdat ASC
      `;
  
      // Fetch nested replies for each top-level reply
      const repliesWithChildren = await Promise.all(replies.rows.map(async (reply) => {
        const children = await sql`
          SELECT id, parent_reply_id, username, text, createdat
          FROM replies
          WHERE parent_reply_id = ${reply.id}
          ORDER BY createdat ASC
        `;
        return { ...reply, children: children.rows };
      }));
  
      return new Response(
        JSON.stringify(repliesWithChildren),
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