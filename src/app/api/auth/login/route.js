import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(
        JSON.stringify({ message: 'Username and password are required' }),
        { status: 400 }
      );
    }

    // Look up user
    const result = await sql`
      SELECT id, username, password
      FROM users
      WHERE username = ${username};
    `;
    const user = result.rows[0];

    // Validate password
    const passwordMatch =
      user && (await bcrypt.compare(password, user.password));

    if (!passwordMatch) {
      // Avoid disclosing which field is wrong
      return new Response(
        JSON.stringify({ message: 'Invalid credentials' }),
        { status: 401 }
      );
    }

    // Sign a JWT
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Set it in an HttpOnly cookie instead of returning raw token
    const cookie = `token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`;

    return new Response(
      JSON.stringify({ message: 'Login successful' }),
      {
        status: 200,
        headers: {
          'Set-Cookie': cookie,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ message: 'An error occurred' }),
      { status: 500 }
    );
  }
}
