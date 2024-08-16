import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return new Response(JSON.stringify({ message: 'All fields are required' }), { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await sql`
      INSERT INTO users (username, email, password, is_admin)
      VALUES (${username}, ${email}, ${hashedPassword}, false);
    `;

    return new Response(JSON.stringify({ message: 'Account created successfully' }), { headers: { 'Content-Type': 'application/json' }, status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }
}
