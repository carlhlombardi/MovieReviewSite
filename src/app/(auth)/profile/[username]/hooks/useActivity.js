'use client';
import { useState, useCallback } from 'react';

// ✅ Allowed actions (must match DB constraint exactly)
const ALLOWED_TYPES = [
  'wants',
  'doesnt want',
  'has seen',
  'hasnt seen',
  'has',
  'doesnt have',
  'commented on',
  'replied to a comment',
  'liked',
  'followed',
  'social',
];

// ✅ Filter to only valid activity actions
const filterAllowed = (feed) => {
  if (!Array.isArray(feed)) return [];
  return feed.filter((item) => ALLOWED_TYPES.includes(item.action));
};

// ✅ Nicely format an activity entry into a readable sentence
const formatActivity = (activity) => {
  const { username, action, movie_title, target_type } = activity;
  const name = username || 'Someone';

  switch (action) {
    case 'wants':
      return `${name} wants ${movie_title || target_type || 'something'}`;
    case 'doesnt want':
      return `${name} doesn't want ${movie_title || target_type || 'that'}`;
    case 'has seen':
      return `${name} has seen ${movie_title || 'this movie'}`;
    case 'hasnt seen':
      return `${name} hasn't seen ${movie_title || 'this movie yet'}`;
    case 'has':
      return `${name} has ${movie_title || 'this item'}`;
    case 'doesnt have':
      return `${name} doesn't have ${movie_title || 'that item'}`;
    case 'commented on':
      return `${name} commented on ${movie_title || 'a movie'}`;
    case 'replied to a comment':
      return `${name} replied to a comment on ${movie_title || 'a post'}`;
    case 'liked':
      return `${name} liked ${movie_title || 'a post'}`;
    case 'followed':
      // 🟢 Show the followed user's name (stored in movie_title for social actions)
      return `${name} followed ${movie_title || 'a user'}`;
    case 'social':
      return `${name} did something social`;
    default:
      return `${name} did something`;
  }
};

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
        const filtered = filterAllowed(data.feed).map((a) => ({
          ...a,
          formatted: formatActivity(a),
        }));
        setRecentActivity(filtered);
      }

      if (followingRes.ok) {
        const data = await followingRes.json();
        const filtered = filterAllowed(data.feed).map((a) => ({
          ...a,
          formatted: formatActivity(a),
        }));
        setFollowingActivity(filtered);
      }
    } catch (err) {
      console.error('❌ Error fetching activity:', err);
    }
  }, []);

  return { recentActivity, followingActivity, fetchActivityFeed };
}
