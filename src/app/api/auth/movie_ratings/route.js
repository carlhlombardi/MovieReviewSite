import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken'; // Import this if you haven't

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
      RETURNING id, username, rating, created_at;
    `;

    return res.status(200).json(result.rows[0]); // Ensure data is returned correctly
  } catch (error) {
    console.error('Error submitting rating:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
