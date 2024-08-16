import { sql } from '@vercel/postgres';

export async function POST(req) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ message: 'User ID is required' }), { status: 400 });
    }

    await sql`
      UPDATE users
      SET approved = true
      WHERE id = ${userId};
    `;

    return new Response(JSON.stringify({ message: 'User approved' }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error('Error approving user:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }
}
