import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Handler to get likes for a specific movie
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
      SELECT
        l.user_id,
        u.user_name,
        m.movie_name,
        l.url,
        l.liked_at
      FROM likes l
      JOIN users u ON l.user_id = u.id
      JOIN movies m ON l.movie_id = m.id
      WHERE l.movie_id = (
        SELECT id
        FROM horrormovies
        WHERE url = ${movieUrl}
      )
      ORDER BY l.liked_at DESC;
    `;

    return new Response(
      JSON.stringify(result.rows),
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch likes error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch likes' }),
      { status: 500 }
    );
  }
}

// Handler to add a new like
export async function POST(request) {
  try {
    const { url, genre } = await request.json();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Verify the JWT token and extract the user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Fetch movie ID and movie name using the film URL
    const movieResult = await sql`
      SELECT id, movie_name
      FROM horrormovies
      WHERE url = ${url}
    `;
    const movie = movieResult.rows[0];
    const movieId = movie?.id;
    const movieName = movie?.movie_name;

    if (!movieId) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    // Check if the like already exists
    const existingLike = await sql`
      SELECT user_id
      FROM likes
      WHERE user_id = ${userId}
      AND movie_id = ${movieId}
      AND genre = ${genre};
    `;

    if (existingLike.rowCount > 0) {
      return new Response(
        JSON.stringify({ message: 'Already liked' }),
        { status: 400 }
      );
    }

    // Insert new like
    const result = await sql`
      INSERT INTO likes (user_id, movie_id, genre, url, liked_at, movie_name)
      VALUES (${userId}, ${movieId}, ${genre}, ${url}, NOW(), ${movieName})
      RETURNING user_id, movie_id, genre, url, liked_at, movie_name;
    `;

    return new Response(
      JSON.stringify(result.rows[0]),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add like error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add like' }),
      { status: 500 }
    );
  }
}

// Handler to delete a like
export async function DELETE(request) {
  try {
    // Extract query parameters
    const url = new URL(request.url);
    const genre = url.searchParams.get('genre');
    const movieUrl = url.searchParams.get('url');

    if (!genre || !movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Genre and movie URL are required' }),
        { status: 400 }
      );
    }

    // Extract and verify the authorization token
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

    // Fetch movie ID using the film URL
    const movieIdResult = await sql`
      SELECT id
      FROM horrormovies
      WHERE url = ${movieUrl}
    `;
    const movieId = movieIdResult.rows[0]?.id;

    if (!movieId) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    // Check if the like exists and belongs to the user
    const likeResult = await sql`
      SELECT user_id
      FROM likes
      WHERE user_id = ${userId}
      AND movie_id = ${movieId}
      AND genre = ${genre};
    `;
    const like = likeResult.rows[0];

    if (!like) {
      return new Response(
        JSON.stringify({ message: 'Like not found' }),
        { status: 404 }
      );
    }

    // Delete the like from the database
    await sql`
      DELETE FROM likes
      WHERE user_id = ${userId}
      AND movie_id = ${movieId}
      AND genre = ${genre};
    `;

    return new Response(
      JSON.stringify({ message: 'Like deleted' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete like error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to delete like' }),
      { status: 500 }
    );
  }
}