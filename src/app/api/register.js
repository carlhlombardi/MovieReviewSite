import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { username, email, password } = req.body;
    const client = await pool.connect();
    try {
      await client.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, password]);
      res.status(200).json({ message: 'User registered' });
    } catch (error) {
      res.status(500).json({ message: 'Error registering user' });
    } finally {
      client.release();
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
