// app/api/auth/search/route.js

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
  
    if (!query) {
      return Response.json({ error: 'Missing query' }, { status: 400 });
    }
  
    try {
      const searchRes = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      const searchData = await searchRes.json();
  
      // Filter exact title matches (case-insensitive)
      const exactMatches = (searchData.results || []).filter(
        (movie) => movie.title?.toLowerCase() === query.toLowerCase()
      );
  
      // If no exact matches, return empty array
      if (exactMatches.length === 0) {
        return Response.json({ results: [] });
      }
  
      // Fetch credits (director & stars) for each match
      const detailedResults = await Promise.all(
        exactMatches.map(async (movie) => {
          const creditsRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${process.env.TMDB_API_KEY}`
          );
          const credits = await creditsRes.json();
  
          const director = credits.crew?.find((p) => p.job === 'Director')?.name || 'Unknown';
          const stars = credits.cast?.slice(0, 3).map((actor) => actor.name).join(', ') || 'N/A';
  
          return {
            title: movie.title,
            year: movie.release_date?.slice(0, 4) || 'Unknown',
            director,
            stars,
          };
        })
      );
  
      return Response.json({ results: detailedResults });
    } catch (err) {
      console.error('API error:', err);
      return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
  