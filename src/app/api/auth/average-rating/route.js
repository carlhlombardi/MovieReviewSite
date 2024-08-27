import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      // Extract the URL from query parameters
      const { url } = req.query;

      if (!url) {
        return res.status(400).json({ message: 'URL parameter is required' });
      }

      // Query to get the average rating for the movie
      const result = await sql`
        SELECT AVG(rating) AS average_rating
        FROM movie_ratings
        WHERE url = ${url};
      `;

      const averageRating = result.rows[0]?.average_rating || 0;
      res.status(200).json({ averageRating });
    } catch (error) {
      console.error('Error fetching average rating:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
}
