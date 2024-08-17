import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export async function GET(request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1]; // Extract token from "Bearer <token>"

  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401 }
    );
  }

  try {
    // Verify the token and extract id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const id = decoded.id;

    // Query the database for the user by id
    const result = await sql`
      SELECT username, email
      FROM users
      WHERE id = ${id};
    `;

    const user = result.rows[0];

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // Respond with user data
    return new Response(
      JSON.stringify(user),
      { status: 200 }
    );
  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(
      JSON.stringify({ message: 'Invalid token' }),
      { status: 401 }
    );
  }
}
