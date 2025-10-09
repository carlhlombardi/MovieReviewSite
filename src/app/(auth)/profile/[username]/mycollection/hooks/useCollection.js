'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Fetches /api/auth/profile/{username}/mycollection
 * Redirects to /login on 401.
 */
export default function useCollection(username) {
  const router = useRouter();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTrue = useCallback((val) => {
    return val === true || val === 'true' || val === 't' || val === 1 || val === '1';
  }, []);

  const fetchCollection = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/auth/profile/${username}/mycollection`, {
        credentials: 'include',
        cache: 'no-store',
      });

      if (res.status === 401) {
        // not allowed — go login
        router.push('/login');
        return;
      }

      if (!res.ok) {
        throw new Error(`Fetch failed ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();

      // keep original logic: filter by isliked or iswatched then dedupe by url
      const filtered = (json.movies ?? []).filter(
        (m) => isTrue(m.isliked) || isTrue(m.iswatched)
      );

      const deduped = Array.from(new Map(filtered.map((m) => [m.url, m])).values());
      setMovies(deduped);
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError(err.message || String(err));
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [username, router, isTrue]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

  return { movies, loading, error, refresh: fetchCollection };
}
