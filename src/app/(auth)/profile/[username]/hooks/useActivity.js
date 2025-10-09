'use client';
import { useState, useCallback } from 'react';

export function useActivity() {
  const [recentActivity, setRecentActivity] = useState([]);
  const [followingActivity, setFollowingActivity] = useState([]);

  const fetchActivityFeed = useCallback(async (username) => {
    try {
      const [recentRes, followingRes] = await Promise.all([
        fetch(`/api/activity/feed/${username}?limit=5`, { cache: 'no-store' }),
        fetch(`/api/activity/following/${username}?limit=5`, { cache: 'no-store' }),
      ]);

      if (recentRes.ok) {
        const data = await recentRes.json();
        setRecentActivity(data.feed || []);
      }

      if (followingRes.ok) {
        const data = await followingRes.json();
        setFollowingActivity(data.feed || []);
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
    }
  }, []);

  return { recentActivity, followingActivity, fetchActivityFeed };
}
