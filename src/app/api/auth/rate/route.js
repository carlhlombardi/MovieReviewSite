import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { url, rating, user_id } = req.body;

    // Validate inputs
    if (!url || rating < 0 || rating > 100 || !user_id) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    try {
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
