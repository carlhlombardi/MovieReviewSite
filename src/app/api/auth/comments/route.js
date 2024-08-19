import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function handler(request) {
  const method = request.method;

  switch (method) {
    case 'GET':
      return handleGet(request);
    case 'POST':
      return handlePost(request);
    case 'DELETE':
      return handleDelete(request);
    default:
      return new Response(
        JSON.stringify({ message: 'Method Not Allowed' }),
        { status: 405 }
      );
  }
}

// Handle GET requests to fetch comments
async function handleGet(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');
    const username = url.searchParams.get('username');

    if (!movieUrl && !username) {
      return new Response(
        JSON.stringify({ message: 'Movie URL or username is required' }),
        { status: 400 }
      );
    }

    let query = 'SELECT id, url, text, username, createdat FROM comments';
    let params = [];

    if (movieUrl && username) {
      query += ' WHERE url = $1 AND username = $2';
      params = [movieUrl, username];
    } else if (movieUrl) {
      query += ' WHERE url = $1';
      params = [movieUrl];
    } else if (username) {
      query += ' WHERE username = $1';
      params = [username];
    }

    query += ' ORDER BY createdat DESC';

    const result = await sql.query(query, params);

    return new Response(
      JSON.stringify(result.rows),
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch comments error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch comments' }),
      { status: 500 }
    );
  }
}

// Handle POST requests to add a new comment
async function handlePost(request) {
  try {
    const { url, text } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

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

    const result = await sql`
      INSERT INTO comments (url, username, text, createdat)
      VALUES (${url}, ${user.username}, ${text}, NOW())
      RETURNING id, url, text, username, createdat;
    `;

    return new Response(
      JSON.stringify(result.rows[0]),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add comment error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add comment' }),
      { status: 500 }
    );
  }
}

// Handle DELETE requests to remove a comment
async function handleDelete(request) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const movieUrl = url.searchParams.get('url');

    if (!id || !movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Comment ID and movie URL are required' }),
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

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

    await sql`
      DELETE FROM comments
      WHERE id = ${id}
      AND url = ${movieUrl};
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
