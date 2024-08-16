import { sql } from '@vercel/postgres';
import nodemailer from 'nodemailer';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ message: 'Email is required' }), { status: 400 });
    }

    const result = await sql`
      SELECT id, username
      FROM users
      WHERE email = ${email};
    `;

    const user = result.rows[0];

    if (!user) {
      return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await sql`
      UPDATE users
      SET password = ${hashedPassword}
      WHERE id = ${user.id};
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset',
      text: `Your new password is: ${tempPassword}`,
    });

    return new Response(JSON.stringify({ message: 'Password reset email sent' }), { headers: { 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error('Error handling password reset:', error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { 'Content-Type': 'application/json' }, status: 500 });
  }
}
