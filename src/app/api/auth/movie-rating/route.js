import { sql } from '@vercel/postgres';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Extract the Authorization header
      const authHeader = req.headers.authorization;
      const token = authHeader?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
      }

      // Verify and decode the token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const username = decoded.username;

      if (!username) {
        return res.status(401).json({ message: 'Username not found in token' });
      }

      // Extract URL and rating from request body
      const { url, rating } = req.body;

      if (!url || rating === undefined) {
        return res.status(400).json({ message: 'URL and rating are required' });
      }

      // Insert or update the rating in the database
      await sql`
        INSERT INTO movie_ratings (url, username, rating)
        VALUES (${url}, ${username}, ${rating})
        ON CONFLICT (url, username) 
        DO UPDATE SET rating = EXCLUDED.rating, created_at = CURRENT_TIMESTAMP
      `;

      // Send a success response with posted data
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
  }
}
