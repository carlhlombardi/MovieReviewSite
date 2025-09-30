// app/api/auth/suggest/route.js

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
  
    if (!query) {
      return Response.json({ results: [] });
    }
  
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      const data = await res.json();
  
      const topResults = data.results?.slice(0, 5) || [];
  
      const suggestions = await Promise.all(
        topResults.map(async (movie) => {
          const creditsRes = await fetch(
            `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${process.env.TMDB_API_KEY}`
          );
          const credits = await creditsRes.json();
  
          const director = credits.crew?.find((p) => p.job === 'Director')?.name || 'Unknown';
  
          return {
            id: movie.id,
            title: movie.title,
            year: movie.release_date?.slice(0, 4) || 'Unknown',
            director,
          };
        })
      );
  
      return Response.json({ results: suggestions });
    } catch (error) {
      console.error('Suggestion fetch failed:', error);
      return Response.json({ results: [] });
    }
  }
  