import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken'; // Import this if you haven't

export async function GET(request) {
  try {
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

    const url = new URL(request.url).searchParams.get('url');

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

    const ratingResult = await sql`
      SELECT rating
      FROM movie_ratings
      WHERE url = ${url} AND username = ${user.username};
    `;
    const rating = ratingResult.rows[0]?.rating || null;

    return new Response(
      JSON.stringify({ rating }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching rating:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch rating' }),
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { url, rating } = await request.json(); // Ensure you include rating
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
     INSERT INTO movie_ratings (url, rating, username, created_at)
      VALUES (${url}, ${rating}, ${user.username}, NOW())
      ON CONFLICT (url, username) 
      DO UPDATE SET rating = EXCLUDED.rating, created_at = CURRENT_TIMESTAMP
      RETURNING id, username, rating, created_at;
    `;

    return new Response(
      JSON.stringify(result.rows[0]),
      { status: 200 }
    );
  } catch (error) {
    console.error('Add review score error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add review score' }),
      { status: 500 }
    );
  }
}