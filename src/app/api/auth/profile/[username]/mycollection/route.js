// src/app/api/auth/profile/[username]/mycollection/route.js
import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export async function GET(req, { params }) {
  const { username } = params;

  const authHeader = req.headers.get('authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdFromToken = decoded.userId;

    // ✅ check that the token matches the username you’re requesting
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    if (user.id !== userIdFromToken) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
      });
    }

    // ✅ now just pull movies from mycollection where username matches
    const moviesRes = await sql`
      SELECT title, genre, image_url, url
      FROM mycollection
      WHERE username = ${username};
    `;

    return new Response(
      JSON.stringify({ movies: moviesRes.rows }),
      { status: 200 }
    );
  } catch (err) {
    console.error('Error in mycollection route:', err);
    return new Response(
      JSON.stringify({ message: 'Invalid token or server error', error: err.message }),
      { status: 401 }
    );
  }
}
