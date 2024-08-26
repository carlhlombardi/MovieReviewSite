import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { url } = req.query; // Extract URL from query parameters

    // Validate URL
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    try {
      // Check if the URL exists in any movie table
      const tables = [
        'horrormovies',
        'comedymovies',
        'actionmovies',
        'dramamovies',
        'documentarymovies',
        'scifimovies',
        'classicmovies'
      ];

      let movieExists = false;
      for (const table of tables) {
        const movieResponse = await sql`
          SELECT 1 FROM ${sql(table)} WHERE url = ${url}
        `;
        if (movieResponse.rowCount > 0) {
          movieExists = true;
          break;
        }
      }

      if (!movieExists) {
        return res.status(404).json({ error: 'Movie not found' });
      }

      // Calculate the average rating
      const averageRatingResponse = await sql`
        SELECT AVG(rating) AS average_rating
        FROM movie_ratings
        WHERE movie_url = ${url}
      `;
      const averageRating = averageRatingResponse.rows[0].average_rating || 0;

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