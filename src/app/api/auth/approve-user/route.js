import { verify } from 'jsonwebtoken';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      const { userId } = req.body;
      
      if (!token || !userId) {
        return res.status(400).json({ message: 'Bad Request' });
      }
      
      // Verify the token
      const decoded = verify(token, process.env.JWT_SECRET);
      
      // Check if user is an admin
      const adminResult = await sql`
        SELECT is_admin
        FROM users
        WHERE id = ${decoded.id};
      `;
      
      if (!adminResult.rows[0]?.is_admin) {
        return res.status(403).json({ message: 'Forbidden' });
      }
      
      // Approve the user
      await sql`
        UPDATE users
        SET approved = true
        WHERE id = ${id};
      `;
      
      res.status(200).json({ message: 'User approved' });
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
