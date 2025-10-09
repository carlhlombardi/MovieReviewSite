'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Alert, Spinner, Card, Button, Form, Tabs, Tab } from 'react-bootstrap';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { username: profileUsername } = useParams();
  const fileInputRef = useRef(null);

  // ─── States ─────────────────────────────
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  // Followers / Following
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // Movies
  const [ownedMovies, setOwnedMovies] = useState([]);
  const [wantedMovies, setWantedMovies] = useState([]);
  const [seenMovies, setSeenMovies] = useState([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [wantedCount, setWantedCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);

  // Activity feed
  const [recentActivity, setRecentActivity] = useState([]);
  const [followingActivity, setFollowingActivity] = useState([]);

  const isSelf = loggedInUser && profile && loggedInUser.username === profile.username;

  // ───────────────────────────
  // Fetch followers/following
  // ───────────────────────────
  const fetchFollowLists = useCallback(async (username) => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/user/followers?username=${username}`),
        fetch(`/api/user/following?username=${username}`),
      ]);

      const followersData = await followersRes.json();
      const followingData = await followingRes.json();

      setFollowers(followersData.users || []);
      setFollowing(followingData.users || []);
    } catch (err) {
      console.error('Error fetching follow lists:', err);
    }
  }, []);

  // ───────────────────────────
  // Fetch movies
  // ───────────────────────────
  const fetchMovieLists = useCallback(async (username) => {
    try {
      const res = await fetch(`/api/user/movies?username=${encodeURIComponent(username)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch user movies');
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

  // ───────────────────────────
  // Fetch activity feed
  // ───────────────────────────
  const fetchActivityFeed = useCallback(async (username) => {
    try {
      const [recentRes, followingRes] = await Promise.all([
        fetch(`/api/activity/feed/${username}?limit=5`, { cache: 'no-store' }),
        fetch(`/api/activity/following/${username}?limit=5`, { cache: 'no-store' }),
      ]);

      if (!recentRes.ok || !followingRes.ok) return;

      const recentData = await recentRes.json();
      const followingData = await followingRes.json();

      setRecentActivity((recentData.feed || []).slice(0, 5));
      setFollowingActivity((followingData.feed || []).slice(0, 5));
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    }
  }, []);

  // ───────────────────────────
  // Fetch profile
  // ───────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!profileUsername) {
        router.replace('/login');
        return;
      }

      // Auth user
      const authRes = await fetch('/api/auth/profile', { credentials: 'include', cache: 'no-store' });
      let authUser = null;
      if (authRes.ok) authUser = await authRes.json();
      setLoggedInUser(authUser);

      // Profile (self or public)
      const profileUrl =
        authUser && profileUsername === authUser.username
          ? '/api/auth/profile'
          : `/api/users/${profileUsername}`;

      const profileRes = await fetch(profileUrl, { credentials: 'include', cache: 'no-store' });
      if (profileRes.status === 401) {
        router.replace('/login');
        return;
      }
      if (!profileRes.ok) throw new Error('Failed to fetch profile');

      const profileData = await profileRes.json();
      setProfile(profileData);
      setAvatarUrl(profileData.avatar_url || '');
      setBio(profileData.bio || '');

      // Follow status
      if (authUser && profileData.username !== authUser.username) {
        const followCheck = await fetch(`/api/follow/status?followingUsername=${profileData.username}`, {
          credentials: 'include',
        });
        if (followCheck.ok) {
          const { following } = await followCheck.json();
          setIsFollowing(following);
        }
      }

      await Promise.all([
        fetchFollowLists(profileData.username),
        fetchMovieLists(profileData.username),
        fetchActivityFeed(profileData.username),
      ]);
    } catch (err) {
      console.error('Error in profile fetch:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [profileUsername, router, fetchFollowLists, fetchMovieLists, fetchActivityFeed]);

  // ───────────────────────────
  // Avatar upload
  // ───────────────────────────
  const handleAvatarUpload = async (file) => {
    if (!isSelf) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      setSaving(true);
      setError('');
      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const newUrl = data.avatar_url || data.url;
      setAvatarUrl(`${newUrl}?t=${Date.now()}`);

      await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: newUrl, bio }),
      });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Upload failed');
    } finally {
      setSaving(false);
    }
  };

  // ───────────────────────────
  // Save profile changes
  // ───────────────────────────
  const handleSave = async () => {
    if (!isSelf) return;
    try {
      setSaving(true);
      setError('');
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: avatarUrl, bio }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      await fetchProfile();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  // ───────────────────────────
  // Follow / Unfollow
  // ───────────────────────────
  const handleFollowToggle = async () => {
    if (!loggedInUser || !profile) return;
    const method = isFollowing ? 'DELETE' : 'POST';

    try {
      const res = await fetch('/api/follow', {
        method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followingUsername: profile.username }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      if (data.success) {
        setIsFollowing(!isFollowing);
        await fetchFollowLists(profile.username);
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err);
      setError('Follow/unfollow failed');
    }
  };

  // ───────────────────────────
  // Initial load
  // ───────────────────────────
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // ───────────────────────────
  // UI
  // ───────────────────────────
  if (isLoading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading profile…</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mt-5">
        {error}
      </Alert>
    );
  }

  if (!profile) {
    return (
      <Alert variant="warning" className="mt-5">
        Profile not found.
      </Alert>
    );
  }

  return (
    <div className="container mt-5">
      <h2>
        {isSelf
          ? `Welcome back, ${profile.firstname || profile.username}`
          : `Profile of ${profile.username}`}
      </h2>

      {/* ─── Profile Card ───────────────────────────── */}
      <Card className="mb-4 p-3">
        <Card.Body className="text-center">
          <div
            style={{
              width: 120,
              height: 120,
              margin: '0 auto',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid #ccc',
              cursor: isSelf ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
            }}
            onClick={() => isSelf && fileInputRef.current?.click()}
          >
            {avatarUrl ? (
              <Image
                key={avatarUrl}
                src={avatarUrl}
                alt={`${profile.username}'s avatar`}
                width={120}
                height={120}
                style={{ objectFit: 'cover' }}
              />
            ) : (
              isSelf && <span>Click to add avatar</span>
            )}
          </div>

          {isSelf && (
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => e.target.files[0] && handleAvatarUpload(e.target.files[0])}
            />
          )}

          <p className="mt-3">
            <strong>Username:</strong> {profile.username}
          </p>
          <p>
            <strong>Date Joined:</strong>{' '}
            {new Date(profile.date_joined).toLocaleDateString()}
          </p>

          <p className="mt-3">
            <strong>Bio:</strong> {profile.bio || 'No bio yet.'}
          </p>

          {isSelf && (
            <>
              <Form.Group className="mt-2">
                <Form.Label>Edit Bio</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </Form.Group>

              <Button className="mt-3" onClick={handleSave} disabled={saving} variant="primary">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          )}

          {!isSelf && loggedInUser && (
            <Button
              className="mt-3"
              onClick={handleFollowToggle}
              variant={isFollowing ? 'secondary' : 'primary'}
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </Button>
          )}
        </Card.Body>
      </Card>

      {/* ─── Movies Tabs ───────────────────────────── */}
      <Card className="mb-4">
        <Card.Body>
          <Tabs defaultActiveKey="owned" id="movie-tabs" className="mb-3">
            {/* OWNED */}
            <Tab eventKey="owned" title={`Owned (${ownedCount})`}>
              <MovieList movies={ownedMovies} username={profile.username} link="mycollection" />
            </Tab>

            {/* WANTED */}
            <Tab eventKey="wanted" title={`Wanted (${wantedCount})`}>
              <MovieList movies={wantedMovies} username={profile.username} link="wantedformycollection" />
            </Tab>

            {/* SEEN */}
            <Tab eventKey="seen" title={`Seen (${seenCount})`}>
              <MovieList movies={seenMovies} username={profile.username} link="seenit" />
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
}

// ─── Reusable Movie List Component ─────────────────────────────
function MovieList({ movies, username, link }) {
  if (movies.length === 0) {
    return <p className="text-muted">No movies yet.</p>;
  }
  return (
    <>
      <div className="d-flex flex-wrap gap-3">
        {movies.map((movie) => (
          <div key={movie.tmdb_id} className="text-center">
            <Image
              src={movie.image_url || '/images/default-poster.png'}
              alt={movie.film}
              width={80}
              height={120}
              className="border rounded"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 text-center">
        <Link
          href={`/profile/${username}/${link}`}
          className="btn btn-outline-primary btn-sm"
        >
          See All
        </Link>
      </div>
    </>
  );
}
