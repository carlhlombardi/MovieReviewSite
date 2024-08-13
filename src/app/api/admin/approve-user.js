import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { id } = req.body;
    const client = await pool.connect();
    try {
      await client.query('UPDATE users SET is_approved = TRUE WHERE id = $1', [id]);
      res.status(200).json({ message: 'User approved' });
    } finally {
      client.release();
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
