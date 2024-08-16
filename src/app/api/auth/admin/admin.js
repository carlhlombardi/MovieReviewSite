import { verify } from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ isAdmin: false });
      }
      
      // Verify the token
      const decoded = verify(token, process.env.JWT_SECRET);
      const userId = decoded.userId;
      
      // Check if user is an admin
      const result = await sql`
        SELECT is_admin
        FROM users
        WHERE id = ${userId};
      `;
      
      const isAdmin = result.rows[0]?.is_admin || false;
      
      res.status(200).json({ isAdmin });
    } catch (error) {
      res.status(401).json({ isAdmin: false });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
