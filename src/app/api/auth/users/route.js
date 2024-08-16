import { sql } from '@vercel/postgres';

export async function GET(req) {
  try {
    // Query to fetch all users
    const result = await sql`
      SELECT id, username, email, approved FROM users;
    `;

    return new Response(JSON.stringify(result.rows), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}

export async function POST(req) {
  try {
    const { userId, action } = await req.json();

    if (!userId || !action) {
      return new Response(JSON.stringify({ error: 'Missing parameters' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    if (action === 'approve') {
      // Query to approve a user
      await sql`
        UPDATE users
        SET approved = true
        WHERE id = ${userId};
      `;

      return new Response(JSON.stringify({ message: 'User approved successfully' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } else if (action === 'reject') {
      // Query to reject a user
      await sql`
        DELETE FROM users
        WHERE id = ${userId};
      `;

      return new Response(JSON.stringify({ message: 'User rejected successfully' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      });
    }
  } catch (error) {
    console.error('Error managing user:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
