import { sql } from '@vercel/postgres';

export async function POST(request) {
  try {
    const { url} = await request.json();
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return new Response(
        JSON.stringify({ message: 'Unauthorized' }),
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const userResult = await sql`
      SELECT username
      FROM users
      WHERE id = ${userId};
    `;
    const user = userResult.rows[0];

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    const result = await sql`
     INSERT INTO movie_ratings (url, rating, username, createdat)
      VALUES (${url}, ${rating}, ${user.username}, NOW())
      RETURNING id, username, rating, createdat;
    `;

    return new Response(
      JSON.stringify(result.rows[0]),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add review score error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add review score' }),
      { status: 500 }
    );
  }
}