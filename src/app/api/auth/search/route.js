export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const movieId = searchParams.get("movieId");

  const API_KEY = process.env.TMDB_API_KEY;
  const BASE_URL = "https://api.themoviedb.org/3";

  // 🧭 Helper: Format movie response
  const formatMovie = (movie, credits) => {
    const director = credits.crew?.find((p) => p.job === "Director")?.name || "Unknown";

    const screenwriters =
      credits.crew
        ?.filter((p) => ["Screenplay", "Writer"].includes(p.job))
        .map((p) => p.name)
        .filter(Boolean)
        .join(", ") || "Unknown";

    const producer =
      credits.crew
        ?.filter((p) => p.job === "Producer")
        .map((p) => p.name)
        .filter(Boolean)
        .join(", ") || "Unknown";

    const studio =
      movie.production_companies?.map((p) => p.name).filter(Boolean).join(", ") || "Unknown";

    const genre = movie.genres?.[0]?.name?.toLowerCase() || "unknown";

    const run_time = movie.runtime || null;

    const url = movie.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const image_url = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "/images/fallback.jpg";

    return {
      tmdb_id: movie.id,
      title: movie.title,
      year: movie.release_date?.slice(0, 4) || "Unknown",
      director,
      screenwriters,
      producer,
      studio,
      run_time,
      genre,
      url,
      image_url,
    };
  };

  // 🎯 CASE 1: Fetch single movie by TMDB ID
  if (movieId) {
    try {
      const movieRes = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${API_KEY}`);
      if (!movieRes.ok) throw new Error("Failed to fetch movie details");
      const movie = await movieRes.json();

      const creditsRes = await fetch(`${BASE_URL}/movie/${movieId}/credits?api_key=${API_KEY}`);
      if (!creditsRes.ok) throw new Error("Failed to fetch credits");
      const credits = await creditsRes.json();

      return new Response(
        JSON.stringify({ results: [formatMovie(movie, credits)] }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (error) {
      console.error("❌ Movie fetch error:", error);
      return new Response(JSON.stringify({ error: "Failed to fetch movie details" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // 🎯 CASE 2: Search by movie title (exact match)
  if (!query) {
    return new Response(JSON.stringify({ results: [] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const searchRes = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
    );
    if (!searchRes.ok) throw new Error("Search failed");
    const searchData = await searchRes.json();

    const exactMatches = (searchData.results || []).filter(
      (movie) => movie.title?.toLowerCase() === query.toLowerCase()
    );

    if (exactMatches.length === 0) {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const detailedResults = await Promise.all(
      exactMatches.map(async (match) => {
        const movieRes = await fetch(`${BASE_URL}/movie/${match.id}?api_key=${API_KEY}`);
        const movie = await movieRes.json();

        const creditsRes = await fetch(`${BASE_URL}/movie/${match.id}/credits?api_key=${API_KEY}`);
        const credits = await creditsRes.json();

        return formatMovie(movie, credits);
      })
    );

    return new Response(JSON.stringify({ results: detailedResults }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("❌ Search fetch error:", error);
    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
