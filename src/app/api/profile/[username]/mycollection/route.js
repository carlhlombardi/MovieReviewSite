import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

// This tells Next not to statically render
export const dynamic = 'force-dynamic';

// GET /api/auth/profile/:username/mycollection
export async function GET(request, { params }) {
  const { username } = params;

  // 1. Check for Authorization header
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 401 }
    );
  }

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 3. Fetch the logged-in user's username
    const result = await sql`
      SELECT username FROM users WHERE id = ${userId};
    `;
    const user = result.rows[0];

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    // 4. Only allow if token username matches the URL username
    if (user.username !== username) {
      return new Response(
        JSON.stringify({ message: 'Forbidden' }),
        { status: 403 }
      );
    }

    // 5. Fetch the collection for this username
    const collection = await sql`
      SELECT id, title, genre, url, image_url
      FROM mycollection
      WHERE username = ${username};
    `;

    return new Response(
      JSON.stringify({ movies: collection.rows }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching mycollection API:', error);
    return new Response(
      JSON.stringify({ message: 'Server error', details: error.message }),
      { status: 500 }
    );
  }
}
