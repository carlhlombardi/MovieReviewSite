import { sql } from '@vercel/postgres';

// Fetch comments
export async function GET(req) {
  try {
    const url = new URL(req.url).searchParams.get('url');
    const result = await sql`
      SELECT * FROM comments WHERE url = ${url};
    `;
    return new Response(JSON.stringify(result.rows), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

// Add a comment
export async function POST(req) {
  try {
    const { url, text } = await req.json();
    const token = req.headers.get('Authorization')?.split(' ')[1];
    
    if (!url || !text || !token) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Fetch user info based on token
    const userRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (userRes.status !== 200) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const user = await userRes.json();

    // Insert the comment into the database
    const result = await sql`
      INSERT INTO comments (url, text, userName, createdAt)
      VALUES (${url}, ${text}, ${user.username}, NOW())
      RETURNING *;
    `;

    return new Response(JSON.stringify(result.rows[0]), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
