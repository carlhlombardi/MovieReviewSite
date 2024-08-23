import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Handler to get comments for a specific movie
export async function GET(request) {
  try {
    // Extract URL from query parameters
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    const result = await sql`
      SELECT id, username, text, createdat
      FROM comments
      WHERE url = ${movieUrl}
      ORDER BY createdat DESC;
    `;

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

// Handler to add a new comment
export async function POST(request) {
  try {
    // Extract JSON body
    const { url, text, mentionedUser } = await request.json();

    // Validate input
    if (!text) {
      return new NextResponse(
        JSON.stringify({ message: 'Comment text is required' }),
        { status: 400 }
      );
    }

    // Extract token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Verify token and extract user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Fetch user details from database
    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];

    if (!user) {
      return new NextResponse(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Save comment to database
    const result = await sql`
      INSERT INTO comments (url, text, username, mentioned_user, createdat)
      VALUES (${url}, ${text}, ${user.username}, ${mentionedUser || null}, NOW())
      RETURNING id, username, text, createdat;
    `;

    // Return the new comment
    return new NextResponse(
      JSON.stringify(result.rows[0]),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error posting comment:', error);
    return new NextResponse(
      JSON.stringify({ message: 'Failed to add comment' }),
      { status: 500 }
    );
  }
}

// Handler to delete a comment
export async function DELETE(request) {
  // Extract the query parameters
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const movieUrl = url.searchParams.get('url');

  if (!id || !movieUrl) {
    return new Response(
      JSON.stringify({ message: 'Comment ID and movie URL are required' }),
      { status: 400 }
    );
  }

  // Extract the authorization token from the headers
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401 }
    );
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Retrieve the username associated with the token
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

    // Retrieve the comment to ensure it belongs to the user and matches the movie URL
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

    // Delete the comment from the database
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
