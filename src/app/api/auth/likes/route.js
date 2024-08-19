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
      SELECT user_id, movie_id, genre, liked_at
      FROM likes
      WHERE movie_id = (
        SELECT id
        FROM horrormovies
        WHERE url = ${movieUrl}
      )
      ORDER BY liked_at DESC;
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

    // Fetch movie ID using the film URL
    const movieIdResult = await sql`
      SELECT id
      FROM horrormovies
      WHERE url = ${url}
    `;
    const movieId = movieIdResult.rows[0]?.id;

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
      INSERT INTO likes (user_id, movie_id, genre, liked_at)
      VALUES (${userId}, ${movieId}, ${genre}, NOW())
      RETURNING user_id, movie_id, genre, liked_at;
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
    // Extract the query parameters
    const url = new URL(request.url);
    const genre = url.searchParams.get('genre');
    const movieUrl = url.searchParams.get('url');

    if (!genre || !movieUrl) {
      return new Response(
        JSON.stringify({ message: 'Genre and movie URL are required' }),
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

    // Verify the JWT token and extract the user info
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