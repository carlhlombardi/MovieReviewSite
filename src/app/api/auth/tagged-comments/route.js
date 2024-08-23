import { sql } from '@vercel/postgres';
import { verify } from 'jsonwebtoken';

export async function GET(req) {
  const { username } = new URL(req.url).searchParams;
  const token = req.headers.get('Authorization')?.split(' ')[1];

  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
  }

  try {
    // Verify the token
    verify(token, process.env.JWT_SECRET);

    // Fetch tagged comments
    const result = await sql`
      SELECT c.id, c.comment_text AS commentText, c.movie_url AS movieUrl, c.movie_genre AS movieGenre, c.movie_title AS movieTitle, u.username AS taggingUser
      FROM comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.comment_text LIKE '%' || ${username} || '%';
    `;

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching tagged comments:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
