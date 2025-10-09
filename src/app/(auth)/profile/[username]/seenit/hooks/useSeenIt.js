"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useSeenIt(username) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!username) return;

    const fetchSeenMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/user/movies?username=${encodeURIComponent(username)}`,
          { credentials: "include" }
        );

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          throw new Error(`Fetch failed ${res.status}: ${await res.text()}`);
        }

        const userMovies = await res.json();
        const seenMovies = userMovies.filter((m) => m.is_seen === true);

        setMovies(seenMovies);
      } catch (err) {
        console.error("Error fetching seenit:", err);
        setError(err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSeenMovies();
  }, [username, router]);

  return { movies, loading, error };
}
