import { sql } from '@vercel/postgres';

// Mapping of genres to table names
const movieTables = {
  Horror: 'horrormovies',
  Comedy: 'comedymovies',
  Action: 'actionmovies',
  Drama: 'dramamovies',
  Documentary: 'documentarymovies',
  SciFi: 'scifimovies',
  Classic: 'classicmovies',
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { genre, url, rating, token } = req.body;

    // Validate inputs
    if (!genre || !url || rating < 0 || rating > 100 || !token) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    try {
      // Determine the movie table based on genre
      const movieTable = movieTables[genre];
      if (!movieTable) {
        return res.status(404).json({ error: 'Genre not found' });
      }

      // Get the user_id from the token
      const userResponse = await sql`
        SELECT id FROM users WHERE token = ${token}
      `;
      if (userResponse.rowCount === 0) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      const user_id = userResponse.rows[0].id;

      // Check if the URL exists in the determined movie table
      const movieResponse = await sql`
        SELECT 1 FROM ${sql(movieTable)} WHERE url = ${url}
      `;
      if (movieResponse.rowCount === 0) {
        return res.status(404).json({ error: 'Movie not found' });
      }

      // Insert or update the rating
      await sql`
        INSERT INTO movie_ratings (movie_url, user_id, rating)
        VALUES (${url}, ${user_id}, ${rating})
        ON CONFLICT (movie_url, user_id)
        DO UPDATE SET rating = EXCLUDED.rating
      `;

      res.status(200).json({ message: 'Rating submitted successfully' });
    } catch (error) {
      console.error('Error submitting rating:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
