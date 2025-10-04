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
    // ✅ verify token and take userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userIdFromToken = decoded.userId; // 👈 this matches your payload

    // ✅ get the user by username
    const userRes = await sql`SELECT id FROM users WHERE username = ${username}`;
    const user = userRes.rows[0];

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
      });
    }

    // ✅ only allow current logged-in user to access their own collection
    if (user.id !== userIdFromToken) {
      return new Response(JSON.stringify({ message: 'Forbidden' }), {
        status: 403,
      });
    }

    // ✅ fetch that user’s movies
    const moviesRes = await sql`
      SELECT 
        m.title,
        m.genre,
        m.image_url,
        m.url
      FROM mycollection lm
      JOIN movies m ON m.id = lm.movie_id
      WHERE lm.user_id = ${user.id};
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
