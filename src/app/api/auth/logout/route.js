import { sql } from '@vercel/postgres';

export async function POST(req) {
  try {
    // Clear JWT or session from the client side
    // This route is mainly for frontend logic to handle token deletion

    return new Response('Logged out successfully', {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}
