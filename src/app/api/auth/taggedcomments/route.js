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
      WITH tagged_comments AS (
        SELECT c.id, c.text AS commentText, c.url AS movieUrl, u.username AS taggingUser, 
               m.genre AS movieGenre, m.film AS movieTitle
        FROM comments c
        JOIN users u ON c.user_id = u.id
        JOIN (
          SELECT url, genre, film FROM horrormovies
          UNION ALL
          SELECT url, genre, film FROM actionmovies
          UNION ALL
          SELECT url, genre, film FROM classicmovies
          UNION ALL
          SELECT url, genre, film FROM comedymovies
          UNION ALL
          SELECT url, genre, film FROM documentarymovies
          UNION ALL
          SELECT url, genre, film FROM dramamovies
          UNION ALL
          SELECT url, genre, film FROM scifimovies
        ) m ON c.movie_url = m.url
        WHERE c.text LIKE '%' || ${username} || '%'
      )
      SELECT * FROM tagged_comments;
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
