import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Handler to get likes for a specific movie
export async function GET(request) {
  try {
    const url = new URL(request.url);
    const filmUrl = url.searchParams.get('url'); // Extract film URL from query parameters

    if (!filmUrl) {
      return new Response(
        JSON.stringify({ message: 'URL is required' }),
        { status: 400 }
      );
    }

    // Fetch movie ID using the film URL
    const movieIdResult = await sql`
      SELECT id
      FROM horrormovies
      WHERE url = ${filmUrl}
    `;
    const movieId = movieIdResult.rows[0]?.id;

    if (!movieId) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    // Fetch likes for the movie
    const result = await sql`
      SELECT user_id, movie_id, genre, liked_at
      FROM likes
      WHERE movie_id = ${movieId}
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
    const { url, genre } = await request.json(); // Use url instead of filmUrl
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
    // Extract film URL and genre from query parameters
    const url = new URL(request.url);
    const filmUrl = url.searchParams.get('url');
    const genre = url.searchParams.get('genre');

    if (!filmUrl || !genre) {
      return new Response(
        JSON.stringify({ message: 'URL and genre are required' }),
        { status: 400 }
      );
    }

    // Fetch movie ID using the film URL
    const movieIdResult = await sql`
      SELECT id
      FROM horrormovies
      WHERE url = ${filmUrl}
    `;
    const movieId = movieIdResult.rows[0]?.id;

    if (!movieId) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
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

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Log extracted values for debugging
    console.log(`User ID: ${userId}`);
    console.log(`Movie ID: ${movieId}`);
    console.log(`Genre: ${genre}`);

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

    // Log before deletion
    console.log('Deleting like:', { user_id: userId, movie_id: movieId, genre: genre });

    // Delete the like from the database
    const deleteResult = await sql`
      DELETE FROM likes
      WHERE user_id = ${userId}
      AND movie_id = ${movieId}
      AND genre = ${genre};
    `;

    // Log deletion result
    console.log('Delete result:', deleteResult);

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