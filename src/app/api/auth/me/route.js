import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function GET(request) {
  // Parse the cookies from the request
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map(c => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );

  const token = cookies.token; // we set token=... in POST

  if (!token) {
    return new Response(
      JSON.stringify({ message: 'Unauthorized: no token cookie' }),
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const result = await sql`
      SELECT username, email
      FROM users
      WHERE id = ${userId};
    `;

    const user = result.rows[0];

    if (!user) {
      return new Response(
        JSON.stringify({ message: 'User not found' }),
        { status: 404 }
      );
    }

    return new Response(JSON.stringify(user), { status: 200 });
  } catch (error) {
    console.error('Token verification error:', error);
    return new Response(
      JSON.stringify({ message: 'Invalid token' }),
      { status: 401 }
    );
  }
}
