// app/api/auth/avatar/route.js
import { promises as fs } from 'fs';
import path from 'path';
import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export async function POST(req) {
  try {
    // 1. Get token from HttpOnly cookie
    const cookieHeader = req.headers.get('cookie') || '';
    const token = cookieHeader
      .split(';')
      .find((c) => c.trim().startsWith('token='))
      ?.split('=')[1];

    if (!token) {
      return new Response(JSON.stringify({ message: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Decode token to get user id
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    // 3. Parse the incoming form
    const formData = await req.formData();
    const file = formData.get('avatar');
    if (!file) {
      return new Response(JSON.stringify({ message: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 4. Save file locally (for demo) — replace with S3 if desired
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create uploads folder if not exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = `${userId}-${Date.now()}-${file.name}`;
    const filepath = path.join(uploadDir, filename);
    await fs.writeFile(filepath, buffer);

    // 5. Build URL for client to load
    const avatarUrl = `/uploads/avatars/${filename}`;

    // 6. Update in DB
    await sql`UPDATE users SET avatar_url = ${avatarUrl} WHERE id = ${userId}`;

    return new Response(JSON.stringify({ avatarUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Avatar upload error', err);
    return new Response(JSON.stringify({ message: 'Upload failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
