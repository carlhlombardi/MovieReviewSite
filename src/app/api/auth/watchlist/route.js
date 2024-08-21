import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Handler to get watchlisted movies for a user
export async function GET(request) {
  try {
    // Extract user ID from token
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

    const result = await sql`
      SELECT movie_id, genre
      FROM Watchlist
      WHERE user_id = ${userId};
    `;

    return new Response(
      JSON.stringify(result.rows),
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch watchlist error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch watchlist' }),
      { status: 500 }
    );
  }
}

// Handler to add a movie to watchlist
export async function POST(request) {
  try {
    const { movie_id, genre } = await request.json();
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

    const result = await sql`
      INSERT INTO Watchlist (user_id, movie_id, genre)
      VALUES (${userId}, ${movie_id}, ${genre})
      ON CONFLICT (user_id, movie_id, genre) DO NOTHING
      RETURNING user_id, movie_id, genre;
    `;

    return new Response(
      JSON.stringify(result.rows[0]),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add to watchlist error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add to watchlist' }),
      { status: 500 }
    );
  }
}

// Handler to remove a movie from watchlist
export async function DELETE(request) {
  try {
    const url = new URL(request.url);
    const movie_id = url.searchParams.get('movie_id');
    const genre = url.searchParams.get('genre');

    if (!movie_id || !genre) {
      return new Response(
        JSON.stringify({ message: 'Movie ID and genre are required' }),
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

    await sql`
      DELETE FROM Watchlist
      WHERE user_id = ${userId} AND movie_id = ${movie_id} AND genre = ${genre};
    `;

    return new Response(
      JSON.stringify({ message: 'Movie removed from watchlist' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to remove from watchlist' }),
      { status: 500 }
    );
  }
}
