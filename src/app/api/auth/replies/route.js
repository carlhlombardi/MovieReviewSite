import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { commentId, text, parentReplyId } = await request.json();
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

    // Insert the new reply
    const result = await sql`
      INSERT INTO replies (comment_id, parent_reply_id, user_id, username, text)
      VALUES (${commentId}, ${parentReplyId || null}, ${userId}, ${username}, ${text})
      RETURNING id, comment_id, parent_reply_id, user_id, username, text, createdat
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

    // Fetch top-level replies
    const replies = await sql`
      SELECT id, parent_reply_id, username, text, createdat
      FROM replies
      WHERE comment_id = ${commentId}
      ORDER BY createdat ASC
    `;

    // Fetch nested replies
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