import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  console.log('Request method:', req.method); // Log the request method for debugging

  if (req.method === 'POST') {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const username = decoded.username;

      if (!username) {
        return res.status(401).json({ message: 'Username not found in token' });
      }

      const { url, rating } = req.body;

      if (!url || rating === undefined) {
        return res.status(400).json({ message: 'URL and rating are required' });
      }

      await sql`
        INSERT INTO movie_ratings (url, username, rating)
        VALUES (${url}, ${username}, ${rating})
        ON CONFLICT (url, username) 
        DO UPDATE SET rating = EXCLUDED.rating, created_at = CURRENT_TIMESTAMP
      `;

      return res.status(200).json({
        success: true,
        data: {
          url,
          username,
          rating
        }
      });
    } catch (error) {
      console.error('Failed to submit rating:', error);
      return res.status(500).json({ message: 'Failed to submit rating' });
    }
  } else {
    // Handle methods other than POST
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
