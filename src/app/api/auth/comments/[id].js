import { sql } from '@vercel/postgres';

// Delete a comment
export async function DELETE(req) {
  try {
    const { id } = req.query;
    const token = req.headers.get('Authorization')?.split(' ')[1];
    
    if (!id || !token) {
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

    // Delete the comment only if it belongs to the user
    const result = await sql`
      DELETE FROM comments
      WHERE id = ${id} AND userName = ${user.username}
      RETURNING *;
    `;

    if (result.rowCount === 0) {
      return new Response(JSON.stringify({ error: 'Comment not found or not authorized to delete' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    return new Response(JSON.stringify({ message: 'Comment deleted successfully' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
