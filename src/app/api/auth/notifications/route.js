import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];
    const userId = token ? jwt.verify(token, process.env.JWT_SECRET).userId : null;

    if (!userId) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    // Fetch notifications for the user
    const notifications = await sql`
      SELECT id, type, comment_id, movie_url, liker_username, created_at
      FROM notifications
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    return new Response(
      JSON.stringify(notifications.rows),
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch notifications' }),
      { status: 500 }
    );
  }
}
