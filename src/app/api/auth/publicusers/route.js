import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Fetch usernames for all users
      const result = await sql`
        SELECT username
        FROM users;
      `;
      
      res.status(200).json(result.rows);
    } catch (error) {
      console.error('Error fetching usernames:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}