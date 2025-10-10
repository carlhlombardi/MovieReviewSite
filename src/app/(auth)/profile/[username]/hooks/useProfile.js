'use client';
import { useState, useCallback } from 'react';

export function useProfile() {
  const [profile, setProfile] = useState(null);      // Profile being viewed
  const [loggedInUser, setLoggedInUser] = useState(null); // Logged-in user info from JWT
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch profile
   * @param {string} username - optional, if omitted fetches logged-in user's profile
   */
  const fetchProfile = useCallback(async (username) => {
    setLoading(true);
    setError(null);

    try {
      // If username provided, fetch that user's public profile
      // Otherwise fetch logged-in user's profile using JWT
      const url = username
        ? `/api/auth/profile/${encodeURIComponent(username)}`
        : `/api/auth/profile`;

      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok) {
        if (res.status === 404) throw new Error('Profile not found.');
        if (res.status === 401) throw new Error('Unauthorized. Please log in.');
        throw new Error('Failed to fetch profile.');
      }

      const data = await res.json();

      // If fetching logged-in user (no username), store in loggedInUser
      if (!username) setLoggedInUser(data);

      setProfile(data);
    } catch (err) {
      console.error('❌ Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loggedInUser, loading, error, fetchProfile };
}
