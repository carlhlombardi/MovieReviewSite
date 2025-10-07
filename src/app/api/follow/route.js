import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

// Helper: parse cookies
function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [name, ...rest] = c.trim().split('=');
      return [name, decodeURIComponent(rest.join('='))];
    })
  );
}

// ✅ Follow someone
export async function POST(req) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies.token;

  if (!token)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { userId: followerId } = jwt.verify(token, process.env.JWT_SECRET);
  const { followingId } = await req.json();

  if (followerId === followingId)
    return new Response(JSON.stringify({ error: "Can't follow yourself" }), {
      status: 400,
    });

  await sql`
    INSERT INTO follows (follower_id, following_id)
    VALUES (${followerId}, ${followingId})
    ON CONFLICT DO NOTHING;
  `;

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// ✅ Unfollow
export async function DELETE(req) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies.token;

  if (!token)
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { userId: followerId } = jwt.verify(token, process.env.JWT_SECRET);
  const { followingId } = await req.json();

  await sql`
    DELETE FROM follows
    WHERE follower_id = ${followerId} AND following_id = ${followingId};
  `;

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}
