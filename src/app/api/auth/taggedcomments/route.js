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

    // Debugging: Print out query parameters and token
    console.log('Fetching tagged comments for username:', username);
    console.log('Token:', token);

    // Fetch tagged comments
    const result = await sql`
      SELECT c.id, c.text AS commentText, c.url AS movieUrl, u.username AS taggingUser, a.genre AS movieGenre, a.film AS movieTitle
      FROM comments c
      JOIN users u ON c.user_id = u.id
      JOIN actionmovies a ON c.movie_url = a.url
      WHERE c.text LIKE '%' || ${username} || '%'
    `;

    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching tagged comments:', error.message);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
