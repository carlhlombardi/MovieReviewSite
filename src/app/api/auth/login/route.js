import { sql } from '@vercel/postgres';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      // Query the database for the user
      const result = await sql`
        SELECT id, password, is_admin
        FROM users
        WHERE username = ${username};
      `;

      const user = result.rows[0];

      // Check if the user exists and the password is correct
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const token = jwt.sign({ userId: user.id, isAdmin: user.is_admin }, process.env.JWT_SECRET, { expiresIn: '1h' });

      // Respond with the token
      return res.status(200).json({ token });

    } catch (error) {
      console.error('Error logging in:', error);
      return res.status(500).json({ message: 'An error occurred' });
    }
  } else {
    // Handle methods other than POST
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
