'use client';
import { useState, useCallback } from 'react';

export function useProfile() {
  const [profile, setProfile] = useState(null); // Profile being viewed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch profile by username (always uses JWT for authentication)
   * @param {string} username
   */
  const fetchProfile = useCallback(async (username) => {
    if (!username) return;

    setLoading(true);
    setError(null);

    try {
      const url = `/api/auth/profile/${encodeURIComponent(username)}`;

      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) {
        if (res.status === 404) throw new Error('Profile not found.');
        if (res.status === 401) throw new Error('Unauthorized. Please log in.');
        throw new Error('Failed to fetch profile.');
      }

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, fetchProfile };
}
