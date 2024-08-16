import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    const token = req.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'No token provided' }),
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user profile based on the userId from the token
    const result = await sql`
      SELECT username, email
      FROM users
      WHERE id = ${decoded.userId};
    `;

    const user = result.rows[0];

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    return new Response(
      JSON.stringify(user),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Error fetching profile:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}
