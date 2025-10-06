// app/api/auth/profile/route.js
import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

// GET current logged-in user's profile
export async function GET(request) {
  const cookieHeader = request.headers.get('cookie') || '';

  // Parse cookies
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );

  const token = cookies.token;

  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Fetch user
    const result = await sql`
      SELECT id, username, email, firstname, lastname, date_joined, avatar_url, bio
      FROM users
      WHERE id = ${userId};
    `;
    const user = result.rows[0];

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Add isSelf flag if you want to check from front end
    const isSelf = decoded.username === user.username;

    return new Response(JSON.stringify({ ...user, isSelf }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(JSON.stringify({ message: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PATCH to update avatar_url and bio
export async function PATCH(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );

  const token = cookies.token;
  if (!token) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // Grab JSON body
    const { avatar_url, bio } = await request.json();

    await sql`
      UPDATE users
      SET avatar_url = ${avatar_url}, bio = ${bio}
      WHERE id = ${userId};
    `;

    return new Response(JSON.stringify({ message: 'Profile updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return new Response(JSON.stringify({ message: 'Error updating profile' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
