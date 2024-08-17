import { sql } from '@vercel/postgres'; // Ensure @vercel/postgres is correctly installed and configured
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    // Extract JSON body from the request
    const { username, password } = await request.json();

    // Check for required fields
    if (!username || !password) {
      return new Response(JSON.stringify({ message: 'Username and password are required' }), { status: 400 });
    }

    // Query the database for the user
    const result = await sql`
      SELECT id, password
      FROM users
      WHERE username = ${username};
    `;

    const user = result.rows[0];

    // Verify user and password
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return new Response(JSON.stringify({ message: 'Invalid credentials' }), { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Respond with token
    return new Response(JSON.stringify({ token }), { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({ message: 'An error occurred' }), { status: 500 });
  }
}