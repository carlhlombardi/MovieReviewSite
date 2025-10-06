// app/api/upload/route.js
export const runtime = 'nodejs';

import { Buffer } from 'buffer';
import { v2 as cloudinary } from 'cloudinary';
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

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req) {
  const cookieHeader = req.headers.get('cookie');
  const cookies = parseCookies(cookieHeader);
  const token = cookies.token;

  if (!token) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.userId;
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ✅ SAFARI FIX — fallback MIME type if iOS doesn't provide one
    const mimeType = file.type || 'image/jpeg';

    // ✅ Prevent oversized images (Vercel 4.5 MB limit)
    if (file.size > 4_000_000) {
      return new Response(
        JSON.stringify({ error: 'File too large. Please choose a smaller image.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert Blob to base64 safely
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const dataUri = `data:${mimeType};base64,${buffer.toString('base64')}`;

    // ✅ Upload to Cloudinary (overwrite same avatar)
    const uploadResponse = await cloudinary.uploader.upload(dataUri, {
      folder: 'avatars',
      public_id: `avatar-${userId}`,
      overwrite: true,
      invalidate: true, // clears CDN cache
      resource_type: 'image',
    });

    // ✅ Update DB
    await sql`
      UPDATE users
      SET avatar_url = ${uploadResponse.secure_url}
      WHERE id = ${userId};
    `;

    // ✅ Response
    return new Response(JSON.stringify({ avatar_url: uploadResponse.secure_url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    return new Response(
      JSON.stringify({
        error: 'Upload failed',
        details: err.message || 'Unexpected error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
