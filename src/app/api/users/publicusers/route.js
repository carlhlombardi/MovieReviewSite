import { sql } from '@vercel/postgres';

export async function GET(req) {
  try {
    // Fetch usernames for all users
    const result = await sql`
      SELECT username
      FROM users;
    `;
    
    return new Response(JSON.stringify(result.rows), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching usernames:', error);
    return new Response(JSON.stringify({ message: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
