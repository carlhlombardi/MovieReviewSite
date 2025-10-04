import { Pool } from 'pg';

// Adjust to your environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // uncomment if using Vercel + Neon
});

export default pool;
