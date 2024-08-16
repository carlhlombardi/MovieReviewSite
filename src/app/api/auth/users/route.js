import { verify } from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      
      // Verify the token
      const decoded = verify(token, process.env.JWT_SECRET);
      
      // Check if user is an admin
      const adminResult = await sql`
        SELECT is_admin
        FROM users
        WHERE id = ${decoded.userId};
      `;
      
      if (!adminResult.rows[0]?.is_admin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Fetch all users
      const result = await sql`
        SELECT id, username, email, approved
        FROM users;
      `;
      
      res.status(200).json(result.rows);
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}