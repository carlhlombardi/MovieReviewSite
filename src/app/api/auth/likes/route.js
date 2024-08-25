import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const movieUrl = url.searchParams.get('url');

    if (!movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Movie URL is required' }),
        { status: 400 }
      );
    }

    // Get the total like count for the movie across all tables
    const likecountResult = await sql`
      SELECT COUNT(*) AS likecount
      FROM (
        SELECT url FROM horrormovies
        UNION ALL
        SELECT url FROM scifimovies
        UNION ALL
        SELECT url FROM comedymovies
        UNION ALL
        SELECT url FROM actionmovies
        UNION ALL
        SELECT url FROM documentarymovies
        UNION ALL
        SELECT url FROM classicmovies
        UNION ALL
        SELECT url FROM dramamovies
      ) AS all_movies
      JOIN likes ON all_movies.url = likes.url
      WHERE likes.url = ${movieUrl} AND likes.isliked = TRUE;
    `;
    const likecount = parseInt(likecountResult.rows[0].likecount, 10);

    // Check if the user has liked the movie
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ likecount, isliked: false }),
        { status: 200 }
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

    const islikedResult = await sql`
      SELECT isliked
      FROM likes
      WHERE username = ${user.username} AND url = ${movieUrl};
    `;
    const isliked = islikedResult.rowCount > 0 ? islikedResult.rows[0].isliked : false;

    return new Response(
      JSON.stringify({ likecount, isliked }),
      { status: 200 }
    );
  } catch (error) {
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

    // Query the different movie tables
    let movieResult = await sql`
      SELECT film, genre
      FROM horrormovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM scifimovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM comedymovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM actionmovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM documentarymovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM classicmovies
      WHERE url = ${url}
      UNION ALL
      SELECT film, genre
      FROM dramamovies
      WHERE url = ${url};
    `;

    let movie = movieResult.rows[0];

    if (!movie) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    const title = movie.film;
    const genre = movie.genre;

    // Insert or update the likes table with username, url, and title
    const postResult = await sql`
      INSERT INTO likes (username, url, title, genre, isliked)
      VALUES (${user.username}, ${url}, ${title}, ${genre}, TRUE)
      ON CONFLICT (username, url) DO UPDATE SET isliked = TRUE
      RETURNING username, url, title, genre;
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