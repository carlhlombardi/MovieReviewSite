import { useState, useEffect } from "react";

export default function useGenreData(genre) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!genre) return;
    const fetchGenreData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/data/${genre}`);
        if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
        const json = await res.json();
        setData(Array.isArray(json) ? json : json.movies ?? []);
      } catch (err) {
        setError(err.message);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGenreData();
  }, [genre]);

  return { data, loading, error };
}
