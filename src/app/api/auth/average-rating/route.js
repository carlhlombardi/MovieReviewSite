import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    try {
      const result = await sql`
        SELECT AVG(rating) AS average_rating
        FROM movie_ratings
        WHERE movie_url = ${url}
      `;

      const averageRating = result.rows[0]?.average_rating || 0;
      res.status(200).json({ averageRating });
    } catch (error) {
      console.error('Error fetching average rating:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
