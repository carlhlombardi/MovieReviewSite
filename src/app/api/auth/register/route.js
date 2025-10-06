import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';

export async function POST(request) {
  try {
    let { firstname, lastname, username, email, password } = await request.json();

    if (!firstname || !lastname || !username || !email || !password) {
      return new Response(
        JSON.stringify({ message: 'First Name, Last Name, User Name, email, and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    username = username.trim();
    email = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ message: 'Invalid email format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check for existing username or email
    const existing = await sql`SELECT 1 FROM users WHERE username=${username} OR email=${email};`;
    if (existing.rows.length > 0) {
      return new Response(
        JSON.stringify({ message: 'Username or email already in use' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user
    await sql`
      INSERT INTO users (firstname, lastname, username, email, password)
      VALUES (${firstname}, ${lastname}, ${username}, ${email}, ${hashedPassword});
    `;

    return new Response(JSON.stringify({ message: 'User registered successfully' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ message: 'An error occurred during registration' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
