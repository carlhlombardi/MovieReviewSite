export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const movieId = searchParams.get('movieId');

  const API_KEY = process.env.TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';

  // 🎯 CASE 1: Fetch by movie ID (when user clicks a suggestion)
  if (movieId) {
    try {
      const movieRes = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
      if (!movieRes.ok) throw new Error('Failed to fetch movie details');
      const movie = await movieRes.json();

      const creditsRes = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
      if (!creditsRes.ok) throw new Error('Failed to fetch credits');
      const credits = await creditsRes.json();

      const director = credits.crew?.find(p => p.job === 'Director')?.name || 'Unknown';

      const screenwriters = credits.crew
        ?.filter(p => ['Screenplay', 'Writer'].includes(p.job))
        .map(p => p.name)
        .filter(Boolean)
        .join(', ') || 'Unknown';

      const producers = credits.crew
        ?.filter(p => p.job === 'Producer')
        .map(p => p.name)
        .filter(Boolean)
        .join(', ') || 'Unknown';

      const studios = movie.production_companies
        ?.map(p => p.name)
        .filter(Boolean)
        .join(', ') || 'Unknown';

      const genre = movie.genres?.[0]?.name?.toLowerCase() || 'unknown';
      const run_time = movie.runtime || null;
      const url = movie.title.toLowerCase().replace(/\s+/g, '-');

      return new Response(JSON.stringify({
        results: [{
          title: movie.title,
          year: movie.release_date?.slice(0, 4) || 'Unknown',
          director,
          screenwriters,
          producers,
          studios,
          run_time,
          genre,
          url,
        }]
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });

    } catch (error) {
      console.error('Movie fetch error:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch movie details' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 🎯 CASE 2: Exact search query by title
  if (!query) {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const searchRes = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const searchData = await searchRes.json();

    const exactMatches = (searchData.results || []).filter(
      (movie) => movie.title?.toLowerCase() === query.toLowerCase()
    );

    if (exactMatches.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const detailedResults = await Promise.all(
      exactMatches.map(async (match) => {
        const movieRes = await fetch(`${BASE_URL}/movie/${match.id}?api_key=${API_KEY}`);
        const movie = await movieRes.json();

        const creditsRes = await fetch(`${BASE_URL}/movie/${match.id}/credits?api_key=${API_KEY}`);
        const credits = await creditsRes.json();

        const director = credits.crew?.find(p => p.job === 'Director')?.name || 'Unknown';

        const screenwriters = credits.crew
          ?.filter(p => ['Screenplay', 'Writer'].includes(p.job))
          .map(p => p.name)
          .filter(Boolean)
          .join(', ') || 'Unknown';

        const producers = credits.crew
          ?.filter(p => p.job === 'Producer')
          .map(p => p.name)
          .filter(Boolean)
          .join(', ') || 'Unknown';

        const studios = movie.production_companies
          ?.map(p => p.name)
          .filter(Boolean)
          .join(', ') || 'Unknown';

        return {
          title: movie.title,
          year: movie.release_date?.slice(0, 4) || 'Unknown',
          director,
          screenwriters,
          producers,
          studios,
        };
      })
    );

    return new Response(JSON.stringify({ results: detailedResults }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Search fetch error:', error);
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
