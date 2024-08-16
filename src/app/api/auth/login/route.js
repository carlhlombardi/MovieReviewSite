import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ message: 'Username and password are required' }), { status: 400 });
    }

    const result = await sql`
      SELECT id, password, is_admin
      FROM users
      WHERE username = ${username};
    `;

    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 });
    }

    const token = jwt.sign({ userId: user.id, isAdmin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '1h' });
    

    return new Response(JSON.stringify({ token }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error('Error logging in:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }
}
