import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';
import { verify } from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ message: 'Token and new password are required' });
      }

      // Verify the token
      const decoded = verify(token, process.env.JWT_SECRET);

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the user's password in the database
      await sql`
        UPDATE users
        SET password = ${hashedPassword}
        WHERE id = ${decoded.userId};
      `;

      res.status(200).json({ message: 'Password has been reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
