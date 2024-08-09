import mysql from 'mysql2';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

export async function GET(req) {
  const url = new URL(req.url, `http://${req.headers.host}`).searchParams.get('URL');

  try {
    if (url) {
      const [rows] = await pool.promise().query(
        'SELECT * FROM horror_movies WHERE URL = ?',
        [url]
      );

      if (rows.length === 0) {
        return new Response('Movie not found', { status: 404 });
      }

      return new Response(JSON.stringify(rows[0]), { status: 200 });
    } else {
      const [rows] = await pool.promise().query('SELECT * FROM horror_movies');
      return new Response(JSON.stringify(rows), { status: 200 });
    }
  } catch (error) {
    console.error(error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
