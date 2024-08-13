import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM comments WHERE is_approved = FALSE');
      res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
