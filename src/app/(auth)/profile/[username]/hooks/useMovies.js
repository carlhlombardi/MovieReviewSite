'use client';
import { useState, useCallback } from 'react';

export function useMovies() {
  const [ownedMovies, setOwnedMovies] = useState([]);
  const [wantedMovies, setWantedMovies] = useState([]);
  const [seenMovies, setSeenMovies] = useState([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [wantedCount, setWantedCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);

  const fetchMovieLists = useCallback(async (username) => {
    try {
      const res = await fetch(`/api/user/movies?username=${encodeURIComponent(username)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch movies');

      const allMovies = await res.json();
      const owned = allMovies.filter((m) => m.is_liked);
      const wanted = allMovies.filter((m) => m.is_wanted);
      const seen = allMovies.filter((m) => m.is_seen);

      setOwnedMovies(owned.slice(0, 6));
      setWantedMovies(wanted.slice(0, 6));
      setSeenMovies(seen.slice(0, 6));
      setOwnedCount(owned.length);
      setWantedCount(wanted.length);
      setSeenCount(seen.length);
    } catch (err) {
      console.error('Error fetching movie lists:', err);
    }
  }, []);

  return { ownedMovies, wantedMovies, seenMovies, ownedCount, wantedCount, seenCount, fetchMovieLists };
}
