import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken'; 

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { url, rating } = req.body;
    const token = req.headers.authorization?.split(' ')[1]; 

    if (!url || rating === undefined || !token) {
      return res.status(400).json({ error: 'URL, rating, and token are required' });
    }

    try {
      // Verify and decode the token
      const decoded = jwt.verify(token, SECRET_KEY);
      const user_id = decoded.user_id;

      if (!user_id) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      // Insert or update the rating in the database
      await sql`
        INSERT INTO movie_ratings (url, user_id, rating)
        VALUES (${url}, ${user_id}, ${rating})
        ON CONFLICT (url, user_id) 
        DO UPDATE SET rating = EXCLUDED.rating, created_at = CURRENT_TIMESTAMP
      `;

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
