// app/api/auth/profile/route.js
import jwt from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );
}

export async function GET(req) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
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

    const { rows } = await sql`
      SELECT id, username, firstname, lastname, email,
             avatar_url, bio, date_joined
      FROM users
      WHERE id = ${userId};
    `;

    if (rows.length === 0) {
      return new Response(JSON.stringify({ message: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('GET profile error', err);
    return new Response(JSON.stringify({ message: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function PATCH(req) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
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

    const body = await req.json();
    const avatar_url = body.avatar_url ?? null;
    const bio = body.bio ?? null;

    // Update both avatar_url and bio
    const { rows } = await sql`
      UPDATE users
      SET avatar_url = ${avatar_url},
          bio = ${bio}
      WHERE id = ${userId}
      RETURNING id, username, firstname, lastname, email,
                avatar_url, bio, date_joined;
    `;

    return new Response(JSON.stringify(rows[0]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('PATCH profile error', err);
    return new Response(
      JSON.stringify({ message: 'Invalid token or update error' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
