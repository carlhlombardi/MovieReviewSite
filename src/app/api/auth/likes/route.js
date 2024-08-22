import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');

    // Fetch liked movies
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

    if (movieUrl) {
      // Check if the specific movie is liked
      const islikedResult = await sql`
        SELECT isliked
        FROM likes
        WHERE username = ${user.username} AND url = ${movieUrl};
      `;
      const isliked = islikedResult.rowCount > 0 ? islikedResult.rows[0].isliked : false;

      // Get the like count for the specific movie
      const likecountResult = await sql`
        SELECT COUNT(*) AS likecount
        FROM likes
        WHERE url = ${movieUrl} AND isliked = TRUE;
      `;
      const likecount = parseInt(likecountResult.rows[0].likecount, 10);

      return new Response(
        JSON.stringify({ likecount, isliked }),
        { status: 200 }
      );
    } else {
      // Get all liked movies for the user
      const likedMoviesResult = await sql`
        SELECT url
        FROM likes
        WHERE username = ${user.username} AND isliked = TRUE;
      `;
      
      const likedMovies = likedMoviesResult.rows.map(row => row.url);

      return new Response(
        JSON.stringify({ likedMovies }),
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error fetching liked movies:', error);
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
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded JWT:', decoded);
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
    console.log('User Found:', user.username);

    const postResult = await sql`
      INSERT INTO likes (username, url, isliked)
      VALUES (${user.username}, ${url}, TRUE)
      ON CONFLICT (username, url) DO UPDATE SET isliked = TRUE
      RETURNING username, url;
    `;
    console.log('POST Result:', postResult);

    if (postResult.rowCount === 0) {
      return new Response(
        JSON.stringify({ message: 'Item already liked' }),
        { status: 409 }
      );
    }

    return new Response(
      JSON.stringify({ message: 'Item liked' }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add like error:', error);  // Log full error
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
          return new Response(
              JSON.stringify({ message: 'Unauthorized or missing movie URL' }),
              { status: 401 }
          );
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Decoded JWT:', decoded);
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

      const deleteResult = await sql`
          UPDATE likes
          SET isliked = FALSE
          WHERE username = ${user.username} AND url = ${movieUrl}
          RETURNING username, url;
      `;
      console.log('DELETE Result:', deleteResult);

      if (deleteResult.rowCount === 0) {
          return new Response(
              JSON.stringify({ message: 'Like not found' }),
              { status: 404 }
          );
      }

      return new Response(
          JSON.stringify({ message: 'Like removed' }),
          { status: 200 }
      );
  } catch (error) {
      console.error('Delete like error:', error);  // Log full error
      return new Response(
          JSON.stringify({ message: 'Failed to remove like' }),
          { status: 500 }
      );
  }
}