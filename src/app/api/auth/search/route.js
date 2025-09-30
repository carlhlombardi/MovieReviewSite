export default async function handler(req, res) {
    const { query } = req.query;
  
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }
  
    try {
      const tmdbRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      const data = await tmdbRes.json();
      res.status(200).json(data);
    } catch (error) {
      console.error('TMDB search failed:', error);
      res.status(500).json({ error: 'Failed to fetch from TMDB' });
    }
  }