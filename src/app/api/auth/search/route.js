export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const movieId = searchParams.get('movieId');
  
    const API_KEY = process.env.TMDB_API_KEY;
    const BASE_URL = 'https://api.themoviedb.org/3';
  
    if (movieId) {
      // Fetch movie by ID
      try {
        const movieRes = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
        if (!movieRes.ok) throw new Error('Movie not found');
        const movie = await movieRes.json();
  
        const creditsRes = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
        if (!creditsRes.ok) throw new Error('Credits not found');
        const credits = await creditsRes.json();
  
        const director = credits.crew?.find(p => p.job === 'Director')?.name || 'Unknown';
        const stars = credits.cast?.slice(0, 3).map(c => c.name).join(', ') || 'N/A';
  
        return new Response(JSON.stringify({
          results: [{
            title: movie.title,
            year: movie.release_date?.slice(0, 4) || 'Unknown',
            director,
            stars,
          }]
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
  
      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
  
    if (!query) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  
    // Search for exact matches by title
    try {
      const searchRes = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
      const searchData = await searchRes.json();
  
      const exactMatches = (searchData.results || []).filter(
        (movie) => movie.title?.toLowerCase() === query.toLowerCase()
      );
  
      if (exactMatches.length === 0) {
        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
  
      const detailedResults = await Promise.all(
        exactMatches.map(async (movie) => {
          const creditsRes = await fetch(`${BASE_URL}/movie/${movie.id}/credits?api_key=${API_KEY}`);
          const credits = await creditsRes.json();
  
          const director = credits.crew?.find(p => p.job === 'Director')?.name || 'Unknown';
          const stars = credits.cast?.slice(0, 3).map((actor) => actor.name).join(', ') || 'N/A';
  
          return {
            title: movie.title,
            year: movie.release_date?.slice(0, 4) || 'Unknown',
            director,
            stars,
          };
        })
      );
  
      return new Response(JSON.stringify({ results: detailedResults }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  