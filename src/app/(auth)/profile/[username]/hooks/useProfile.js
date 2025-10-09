'use client';
import { useState, useCallback } from 'react';

export function useProfile(router) {
  const [profile, setProfile] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (username) => {
    try {
      setLoading(true);
      setError('');

      const authRes = await fetch('/api/auth/profile', { credentials: 'include' });
      let authUser = null;
      if (authRes.ok) authUser = await authRes.json();
      setLoggedInUser(authUser);

      const profileUrl =
        authUser && username === authUser.username
          ? '/api/auth/profile'
          : `/api/users/${username}`;

      const res = await fetch(profileUrl, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch profile');

      const data = await res.json();
      setProfile(data);
    } catch (err) {
      setError(err.message);
      router.replace('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  return { profile, loggedInUser, error, loading, fetchProfile };
}
