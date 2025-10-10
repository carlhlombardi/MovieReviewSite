'use client';
import { useState, useCallback } from 'react';

export function useFollow() {
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch followers and following lists
  const fetchFollowLists = useCallback(async (username) => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/follow?username=${username}&type=followers`, { cache: 'no-store' }),
        fetch(`/api/follow?username=${username}&type=following`, { cache: 'no-store' }),
      ]);

      const followersData = await followersRes.json();
      const followingData = await followingRes.json();

      setFollowers(followersData.users || []);
      setFollowing(followingData.users || []);
    } catch (err) {
      console.error('Error fetching follow lists:', err);
    }
  }, []);

  // Fetch follow status
  const fetchFollowStatus = useCallback(async (username) => {
    try {
      const res = await fetch(`/api/follow?username=${username}&type=status`, { credentials: 'include', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following || false);
      }
    } catch (err) {
      console.error('Error fetching follow status:', err);
    }
  }, []);

  // Toggle follow/unfollow
  const toggleFollow = useCallback(async (username, currentStatus) => {
    try {
      const method = currentStatus ? 'DELETE' : 'POST';
      const res = await fetch('/api/follow', {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingUsername: username }),
      });
      if (res.ok) setIsFollowing(!currentStatus);
    } catch (err) {
      console.error('Follow/unfollow failed:', err);
    }
  }, []);

  return { followers, following, isFollowing, fetchFollowLists, fetchFollowStatus, toggleFollow };
}
