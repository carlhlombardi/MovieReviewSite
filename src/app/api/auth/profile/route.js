import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export async function GET(request) {
  // Read the raw cookie header
  const cookieHeader = request.headers.get('cookie') || '';

  // Parse cookies into an object
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );

  const token = cookies.token; // our login endpoint sets "token=..."

  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    // Verify the token and extract user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Query the database for the user by userId
    const result = await sql`
      SELECT username, email, firstname, lastname, date_joined
      FROM users
      WHERE id = ${userId};
    `;

    const user = result.rows[0];

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    // Respond with user data
    return new Response(JSON.stringify(user), {
      status: 200,
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(JSON.stringify({ message: 'Invalid token' }), {
      status: 401,
    });
  }
}
