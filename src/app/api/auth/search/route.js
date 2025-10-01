export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query');
  const movieId = searchParams.get('movieId');

  const API_KEY = process.env.TMDB_API_KEY;
  const BASE_URL = 'https://api.themoviedb.org/3';

  // 📌 If searching by movie ID (clicked suggestion)
  if (movieId) {
    try {
      const movieRes = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
      const movie = await movieRes.json();

      const creditsRes = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
      const credits = await creditsRes.json();

      const director = credits.crew?.find(p => p.job === 'Director')?.name || 'Unknown';

      const screenwriters = credits.crew
        ?.filter(p => p.job === 'Screenplay' || p.job === 'Writer')
        .map(p => p.name)
        .filter(Boolean);

      const producers = credits.crew
        ?.filter(p => p.job === 'Producer')
        .map(p => p.name)
        .filter(Boolean);

      const studios = movie.production_companies?.map(p => p.name).filter(Boolean);

     const genre = movie.genres?.[0]?.name.toLowerCase() || 'unknown';
const run_time = movie.runtime || null;
const url = movie.title.toLowerCase().replace(/\s+/g, '-');

return new Response(JSON.stringify({
  results: [{
    title: movie.title,
    year: movie.release_date?.slice(0, 4) || 'Unknown',
    director,
    screenwriters: screenwriters.length ? screenwriters.join(', ') : 'Unknown',
    producers: producers.length ? producers.join(', ') : 'Unknown',
    studios: studios.length ? studios.join(', ') : 'Unknown',
    run_time,
    genre,
    url,
  }]
}));

    } catch (error) {
      console.error('Movie fetch error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // 📌 If searching by query (typing exact title)
  if (!query) {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
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
        headers: { 'Content-Type': 'application/json' }
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
          ?.filter(p => p.job === 'Screenplay' || p.job === 'Writer')
          .map(p => p.name)
          .filter(Boolean);

        const producers = credits.crew
          ?.filter(p => p.job === 'Producer')
          .map(p => p.name)
          .filter(Boolean);

        const studios = movie.production_companies?.map(p => p.name).filter(Boolean);

        return {
          title: movie.title,
          year: movie.release_date?.slice(0, 4) || 'Unknown',
          director,
          screenwriters: screenwriters.length ? screenwriters.join(', ') : 'Unknown',
          producers: producers.length ? producers.join(', ') : 'Unknown',
          studios: studios.length ? studios.join(', ') : 'Unknown',
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
