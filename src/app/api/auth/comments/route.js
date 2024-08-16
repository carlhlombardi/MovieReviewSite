import { sql } from '@vercel/postgres';

export async function GET(request) {
  const url = new URL(request.url);
  const movieUrl = url.searchParams.get('url');

  if (!movieUrl) {
    return new Response(
      JSON.stringify({ message: 'Movie URL is required' }),
      { status: 400 }
    );
  }

  try {
    const result = await sql`
      SELECT id, userName, text, createdAt
      FROM comments
      WHERE movieUrl = ${movieUrl}
      ORDER BY createdAt DESC;
    `;

    return new Response(
      JSON.stringify(result.rows),
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch comments error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to fetch comments' }),
      { status: 500 }
    );
  }
}


export async function POST(request) {
  try {
    const { url, text } = await request.json();
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
      INSERT INTO comments (movieUrl, userName, text, createdAt)
      VALUES (${url}, ${user.username}, ${text}, NOW())
      RETURNING id, userName, text, createdAt;
    `;

    return new Response(
      JSON.stringify(result.rows[0]),
      { status: 201 }
    );
  } catch (error) {
    console.error('Add comment error:', error);
    return new Response(
      JSON.stringify({ message: 'Failed to add comment' }),
      { status: 500 }
    );
  }
}
