import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(req) {
  try {
    const token = req.headers.get('Authorization')?.split(' ')[1];

    if (!token) {
      return new Response(JSON.stringify({ error: 'No token provided' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Verify token and decode user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Fetch user details from the database
    const { username } = decoded;
    const result = await sql`
      SELECT username FROM users WHERE username = ${username};
    `;

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    return new Response(JSON.stringify(result.rows[0]), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
