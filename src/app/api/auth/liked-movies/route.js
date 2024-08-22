import { sql } from '@vercel/postgres'; // Ensure @vercel/postgres is correctly installed and configured
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    // Retrieve the Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Authorization token is missing' }),
        { status: 401 }
      );
    }

    // Verify the token and decode it
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Extract username from decoded token
    const username = decoded.username;

    if (!username) {
      return new Response(
        JSON.stringify({ message: 'Username not found in token' }),
        { status: 401 }
      );
    }

    // Fetch the liked movies for the user
    const likedMoviesResult = await sql`
      SELECT url
      FROM likes
      WHERE username = ${username} AND isliked = TRUE;
    `;

    const likedMovies = likedMoviesResult.rows;

    return new Response(
      JSON.stringify({ likedMovies }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Failed to fetch liked movies:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch liked movies' }),
      { status: 500 }
    );
  }
}
