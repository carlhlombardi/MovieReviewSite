import { useState, useEffect } from "react";

export default function useMovieData(genre, url) {
  const [movieData, setMovieData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMovieData = async () => {
      try {
        setIsLoading(true);
        setError("");
        const res = await fetch(`/api/data/${genre}?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("Failed to fetch movie data");
        const data = await res.json();
        setMovieData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMovieData();
  }, [genre, url]);

  return { movieData, isLoading, error };
}
