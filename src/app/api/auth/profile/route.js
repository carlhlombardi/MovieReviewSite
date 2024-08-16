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
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
