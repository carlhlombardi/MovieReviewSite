import { verify } from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const decoded = verify(token, process.env.JWT_SECRET);

      if (!decoded.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const result = await sql`
        SELECT id, username, email, approved
        FROM users;
      `;

      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Admin fetch error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  } else if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const decoded = verify(token, process.env.JWT_SECRET);

      if (!decoded.isAdmin) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      const { userId, approved } = req.body;

      if (typeof approved !== 'boolean') {
        return res.status(400).json({ message: 'Invalid approval status' });
      }

      await sql`
        UPDATE users
        SET approved = ${approved}
        WHERE id = ${userId};
      `;

      res.status(200).json({ message: 'User approval status updated' });
    } catch (error) {
      console.error('User approval error:', error);
      res.status(500).json({ message: 'An error occurred' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
