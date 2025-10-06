import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

/**
 * POST /api/auth/forgot-password
 * Body: { email: string }
 */
export async function POST(req) {
  try {
    const { email } = await req.json();

    // 1️⃣ Require email
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ message: 'Email is required' }), { status: 400 });
    }

    // 2️⃣ Lookup user
    const result = await sql`SELECT id FROM users WHERE email = ${email}`;
    const user = result.rows[0];

    // Always return 200 even if user not found (avoid email enumeration)
    if (!user) {
      return new Response(
        JSON.stringify({ message: 'If that email exists, a reset link will be sent.' }),
        { status: 200 }
      );
    }

    // 3️⃣ Sign a short-lived JWT reset token
    const resetToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' } // short expiry
    );

    // 4️⃣ Build reset URL
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;

    // 5️⃣ Send email (make sure env vars set in Vercel)
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // or your SMTP
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      to: email,
      from: process.env.EMAIL_USER,
      subject: 'Password Reset',
      html: `
        <p>You requested a password reset. This link will expire in 15 minutes.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>If you didn’t request this, ignore this email.</p>
      `,
    });

    return new Response(
      JSON.stringify({ message: 'If that email exists, a reset link will be sent.' }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return new Response(JSON.stringify({ message: 'An error occurred' }), { status: 500 });
  }
}
