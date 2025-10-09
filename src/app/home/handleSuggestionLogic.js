const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

const slugify = (title, tmdb_id) =>
  `${title}-${tmdb_id}`
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const slugifyGenre = (genre) =>
  genre.toString().toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

export async function handleSuggestionClick(movie, setSearchQuery, setShowSuggestions, router) {
  setSearchQuery(movie.title);
  setShowSuggestions(false);

  try {
    const res = await fetch(`${API_URL}/api/auth/search?movieId=${encodeURIComponent(movie.id)}`);
    if (!res.ok) throw new Error("Failed to fetch movie details");

    const apiResponse = await res.json();
    const movieData = apiResponse.results?.[0];
    if (!movieData || !movieData.title || !movieData.year) {
      alert("Movie data is incomplete.");
      return;
    }

    const year = Number(movieData.year) || null;
    const genre = movieData.genre || "Unknown";
    const genreSlug = slugifyGenre(genre);
    const slugifiedUrl = slugify(movieData.title, movieData.tmdb_id);

    const payload = {
      film: movieData.title,
      year,
      tmdb_id: movieData.tmdb_id,
      run_time: movieData.run_time || null,
      screenwriters: movieData.screenwriters || "",
      producer: movieData.producer || "",
      image_url: movieData.image_url || "/images/fallback.jpg",
      genre: genre,
      url: slugifiedUrl,
      studio: movieData.studio || "",
      director: movieData.director || "",
    };

    const insertRes = await fetch(`${API_URL}/api/data/allmovies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!insertRes.ok) {
      const insertData = await insertRes.json().catch(() => ({}));
      alert(`Failed to insert movie: ${insertData.error || "Unknown error"}`);
      return;
    }

    router.push(`/genre/${genreSlug}/${slugifiedUrl}`);
  } catch (error) {
    console.error("❌ Error adding movie:", error);
    alert("An unexpected error occurred while adding the movie.");
  }
}
