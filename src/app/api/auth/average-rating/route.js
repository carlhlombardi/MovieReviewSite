import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { url } = req.query;

    // Validate that the URL parameter is provided
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
      // Query to get the average rating for the specified URL
      const result = await sql`
        SELECT AVG(rating) AS average_rating
        FROM movie_ratings
        WHERE url = ${url}
      `;

      // Extract the average rating from the query result
      const averageRating = result.rows[0]?.average_rating || 0;
      res.status(200).json({ averageRating });
    } catch (error) {
      console.error('Error fetching average rating:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    // Respond with an error if the method is not allowed
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

