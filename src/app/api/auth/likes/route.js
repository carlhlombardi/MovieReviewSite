import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');

    console.log('GET Request - Movie URL:', movieUrl);

    if (!movieUrl) {
      console.log('GET Request - Missing Movie URL');
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    // Get the total like count for the movie
    const likecountResult = await sql`
      SELECT COUNT(*) AS likecount
      FROM likes
      WHERE url = ${movieUrl} AND isliked = TRUE;
    `;
    const likecount = likecountResult.rows[0].likecount;

    console.log('GET Request - Like Count:', likecount);

    // Check if the user has liked the movie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('GET Request - No Token Provided');
      return new Response(
        JSON.stringify({ likecount, isliked: false }),
        { status: 200 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    console.log('GET Request - Decoded User ID:', userId);

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];

    if (!user) {
      console.log('GET Request - User Not Found');
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    console.log('GET Request - User Found:', user.username);

    const islikedResult = await sql`
      SELECT isliked
      FROM likes
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;
    const isliked = islikedResult.rowCount > 0 ? islikedResult.rows[0].isliked : false;

    console.log('GET Request - Is Liked:', isliked);

    return new Response(
      JSON.stringify({ likecount, isliked }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch likes error:', error.message);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch likes' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    console.log('POST Request - URL:', url);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      console.log('POST Request - No Token Provided');
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    console.log('POST Request - Decoded User ID:', userId);

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];

    if (!user) {
      console.log('POST Request - User Not Found');
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }
    console.log('POST Request - User Found:', user.username);

    const postResult = await sql`
      INSERT INTO likes (username, url, isliked)
      VALUES (${user.username}, ${url}, TRUE)
      ON CONFLICT (username, url) DO UPDATE SET isliked = TRUE
      RETURNING username, url;
    `;

    if (postResult.rowCount === 0) {
      console.log('POST Request - Item Already Liked');
      return new Response(
        JSON.stringify({ message: 'Item already liked' }),
        { status: 409 }
      );
    }
    console.log('POST Request - Item Liked');

    return new Response(
      JSON.stringify({ message: 'Item liked' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add like error:', error.message);
    return new Response(
      JSON.stringify({ message: 'Failed to add like' }),
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');
    console.log('DELETE Request - Movie URL:', movieUrl);

    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token || !movieUrl) {
      console.log('DELETE Request - No Token or Movie URL Provided');
      return new Response(
        JSON.stringify({ message: 'Unauthorized or missing movie URL' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    console.log('DELETE Request - Decoded User ID:', userId);

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];

    if (!user) {
      console.log('DELETE Request - User Not Found');
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }
    console.log('DELETE Request - User Found:', user.username);

    const deleteResult = await sql`
      UPDATE likes
      SET isliked = FALSE
      WHERE username = ${user.username} AND url = ${movieUrl}
      RETURNING username, url;
    `;

    if (deleteResult.rowCount === 0) {
      console.log('DELETE Request - Like Not Found');
      return new Response(
        JSON.stringify({ message: 'Like not found' }),
        { status: 404 }
      );
    }
    console.log('DELETE Request - Like Removed');

    return new Response(
      JSON.stringify({ message: 'Like removed' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete like error:', error.message);
    return new Response(
      JSON.stringify({ message: 'Failed to remove like' }),
      { status: 500 }
    );
  }
}
