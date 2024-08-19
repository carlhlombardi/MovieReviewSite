// Import dependencies
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Helper function to get movie ID by URL
const getMovieIdByUrl = async (movieUrl) => {
  try {
    const result = await sql`
      SELECT id
      FROM movies
      WHERE url = ${movieUrl};
    `;
    return result.rows[0]?.id;
  } catch (error) {
    console.error('Error fetching movie ID by URL:', error);
    throw new Error('Failed to fetch movie ID');
  }
};

// Handler to get likes for a specific movie by URL
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

    // Get the movie ID by URL
    const movieId = await getMovieIdByUrl(movieUrl);
    if (!movieId) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

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
    const { url, genre } = await request.json();
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

    // Get the movie ID by URL
    const movieId = await getMovieIdByUrl(url);
    if (!movieId) {
      return new Response(
        JSON.stringify({ message: 'Movie not found' }),
        { status: 404 }
      );
    }

    const result = await sql`
      INSERT INTO likes (user_id, movie_id, genre, liked_at)
      VALUES (${userId}, ${movieId}, ${genre}, NOW())
      ON CONFLICT (user_id, movie_id, genre) DO NOTHING
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

    if (!movieUrl || !genre) {
      return new Response(
        JSON.stringify({ message: 'Movie URL and genre are required' }),
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

    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Get the movie ID by URL
    const movieId = await getMovieIdByUrl(movieUrl);
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
