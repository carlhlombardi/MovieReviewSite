"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useCollection(username) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!username) return;

    const fetchCollectionMovies = async () => {
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

        // ✅ Filter for collection and normalize shape
        const collectionMovies = userMovies
          .filter((m) => m.in_collection === true)
          .map((m) => ({
            ...m,
            genre: m.genre || "unknown",
            url: m.url || m.tmdb_id?.toString() || "",
            image_url: m.image_url || "/images/fallback.jpg",
            film: m.film || m.title || "Untitled",
          }));

        console.log("Fetched movies:", userMovies);


        setMovies(collectionMovies);
      } catch (err) {
        console.error("Error fetching collection:", err);
        setError(err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollectionMovies();
  }, [username, router]);

  return { movies, loading, error };
}
