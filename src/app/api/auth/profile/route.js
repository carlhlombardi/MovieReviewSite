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

// GET logged-in user
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

// PATCH logged-in user (update avatar/bio)
// PATCH logged-in user (update avatar/bio)
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

    // Build dynamic update
    const updates = [];
    if (body.avatar_url !== undefined) updates.push(sql`avatar_url = ${body.avatar_url}`);
    if (body.bio !== undefined) updates.push(sql`bio = ${body.bio}`);

    if (updates.length === 0) {
      return new Response(JSON.stringify({ message: 'No fields to update' }), { status: 400 });
    }

    const { rows } = await sql`
      UPDATE users
      SET ${sql.join(updates, sql`, `)}
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

