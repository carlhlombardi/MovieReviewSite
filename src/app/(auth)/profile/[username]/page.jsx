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

  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  const [ownedMovies, setOwnedMovies] = useState([]);
  const [wantedMovies, setWantedMovies] = useState([]);
  const [seenMovies, setSeenMovies] = useState([]);
  const [ownedCount, setOwnedCount] = useState(0);
  const [wantedCount, setWantedCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);

  // Activity (only used for own profile)
  const [recentActivity, setRecentActivity] = useState([]);
  const [followingActivity, setFollowingActivity] = useState([]);

  const isSelf = !!(loggedInUser && profile && loggedInUser.username === profile.username);

  // ───────────────────────────
  // Helpers to be defensive about response shapes
  // ───────────────────────────
  const normalizeUsersResponse = async (res) => {
    try {
      const json = await res.json();
      // some endpoints return { users: [...] }, others return [...]
      return json?.users ?? json ?? [];
    } catch (err) {
      return [];
    }
  };

  // ───────────────────────────
  // Fetch followers/following
  // ───────────────────────────
  const fetchFollowLists = useCallback(async (username) => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/user/followers?username=${encodeURIComponent(username)}`, { cache: 'no-store' }),
        fetch(`/api/user/following?username=${encodeURIComponent(username)}`, { cache: 'no-store' }),
      ]);

      const followersData = followersRes.ok ? await normalizeUsersResponse(followersRes) : [];
      const followingData = followingRes.ok ? await normalizeUsersResponse(followingRes) : [];

      setFollowers(followersData || []);
      setFollowing(followingData || []);
    } catch (err) {
      console.error('Error fetching follow lists:', err);
      setFollowers([]);
      setFollowing([]);
    }
  }, []);

  // ───────────────────────────
  // Fetch movies (joined with allmovies via your API)
  // ───────────────────────────
  const fetchMovieLists = useCallback(async (username) => {
    try {
      const res = await fetch(`/api/user/movies?username=${encodeURIComponent(username)}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        console.warn('fetchMovieLists non-ok response', res.status);
        setOwnedMovies([]);
        setWantedMovies([]);
        setSeenMovies([]);
        setOwnedCount(0);
        setWantedCount(0);
        setSeenCount(0);
        return;
      }
      const allMovies = await res.json();

      // DB returns joined user_movies + allmovies fields — we expect booleans named is_liked/is_wanted/is_seen
      const owned = (allMovies || []).filter((m) => !!m.is_liked);
      const wanted = (allMovies || []).filter((m) => !!m.is_wanted);
      const seen = (allMovies || []).filter((m) => !!m.is_seen);

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
  // Fetch activity feed (only for own profile)
  // ───────────────────────────
  const fetchActivityFeed = useCallback(async (username) => {
    try {
      // If not logged in as same user, don't call (defensive)
      if (!isSelf) return;

      const [recentRes, followingRes] = await Promise.all([
        fetch(`/api/activity/feed/${encodeURIComponent(username)}?limit=5`, { credentials: 'include', cache: 'no-store' }),
        fetch(`/api/activity/following/${encodeURIComponent(username)}?limit=5`, { credentials: 'include', cache: 'no-store' }),
      ]);

      if (recentRes.ok) {
        const recentData = await recentRes.json();
        setRecentActivity(recentData.feed || []);
      } else {
        setRecentActivity([]);
      }

      if (followingRes.ok) {
        const followingData = await followingRes.json();
        setFollowingActivity(followingData.feed || []);
      } else {
        setFollowingActivity([]);
      }
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    }
  }, [isSelf]);

  // ───────────────────────────
  // Fetch follow status (whether logged-in user follows target)
  // ───────────────────────────
  const fetchFollowStatus = useCallback(async (targetUsername) => {
    try {
      // endpoint returns { following: true/false, followersCount: n }
      const res = await fetch(`/api/users/${encodeURIComponent(targetUsername)}/follow-status`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) {
        // if 401/500 etc just ignore and leave default
        return;
      }
      const json = await res.json();
      setIsFollowing(Boolean(json.following));
    } catch (err) {
      console.error('Error fetching follow status:', err);
    }
  }, []);

  // ───────────────────────────
  // Fetch profile (auth + profile + other resources)
  // ───────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!profileUsername) {
        router.replace('/login');
        return;
      }

      // 1. Get auth user (if any)
      const authRes = await fetch('/api/auth/profile', { credentials: 'include', cache: 'no-store' });
      let authUser = null;
      if (authRes.ok) {
        try {
          authUser = await authRes.json();
        } catch (_) {
          authUser = null;
        }
      }
      setLoggedInUser(authUser);

      // 2. Determine which profile endpoint to call (self vs public)
      const profileUrl = authUser && profileUsername === authUser.username ? '/api/auth/profile' : `/api/users/${encodeURIComponent(profileUsername)}`;

      const profileRes = await fetch(profileUrl, { credentials: 'include', cache: 'no-store' });
      if (profileRes.status === 401) {
        router.replace('/login');
        return;
      }
      if (!profileRes.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileRes.json();
      setProfile(profileData);
      setAvatarUrl(profileData.avatar_url || '');
      setBio(profileData.bio || '');

      // 3. If the visitor is logged in and viewing someone else's profile, check follow status
      if (authUser && profileData.username !== authUser.username) {
        await fetchFollowStatus(profileData.username);
      } else {
        setIsFollowing(false);
      }

      // 4. Always fetch followers/following and movies (public info)
      await Promise.all([
        fetchFollowLists(profileData.username),
        fetchMovieLists(profileData.username),
      ]);

      // 5. Fetch activity feeds only if viewing own profile
      if (authUser && profileData.username === authUser.username) {
        await fetchActivityFeed(profileData.username);
      } else {
        // clear any previous personal activity
        setRecentActivity([]);
        setFollowingActivity([]);
      }
    } catch (err) {
      console.error('Error in profile fetch:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [profileUsername, router, fetchFollowLists, fetchMovieLists, fetchActivityFeed, fetchFollowStatus]);

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
      if (!res.ok) throw new Error(data?.error || 'Upload failed');

      const newUrl = data.avatar_url || data.url;
      setAvatarUrl(`${newUrl}?t=${Date.now()}`);

      // patch profile
      await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: newUrl, bio }),
      });

      // refresh profile
      await fetchProfile();
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

      if (!res.ok) {
        const text = await res.text().catch(() => 'Unknown error');
        throw new Error(text || 'Follow request failed');
      }

      const data = await res.json();
      if (data.success) {
        // optimistic toggle + refresh followers list
        setIsFollowing(!isFollowing);
        fetchFollowLists(profile.username);
      } else {
        throw new Error(data.message || 'Follow API returned no success');
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileUsername]);

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
      <div className="mb-4">
        <h2>
          {isSelf
            ? `Welcome back, ${profile.firstname || profile.username}`
            : `Profile of ${profile.username}`}
        </h2>
      </div>

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

          <p className="mt-3"><strong>Username:</strong> {profile.username}</p>
          <p><strong>Date Joined:</strong> {new Date(profile.date_joined).toLocaleDateString()}</p>
          <p className="mt-3"><strong>Bio:</strong> {profile.bio || 'No bio yet.'}</p>

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

      {/* Followers / Following */}
      <FollowTabs followers={followers} following={following} />

      {/* Activity - only show on own profile */}
      {isSelf && <ActivityTabs recent={recentActivity} following={followingActivity} />}

      {/* Movies */}
      <MovieTabs
        ownedMovies={ownedMovies} ownedCount={ownedCount}
        wantedMovies={wantedMovies} wantedCount={wantedCount}
        seenMovies={seenMovies} seenCount={seenCount}
        username={profile.username}
      />
    </div>
  );
}

// ─── Followers/Following Component ─────────────────────────────
function FollowTabs({ followers, following }) {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Tabs defaultActiveKey="followers" id="follow-tabs" className="mb-3">
          <Tab eventKey="followers" title={`Followers (${followers.length})`}>
            {followers.length > 0 ? (
              <div className="d-flex flex-wrap gap-3">
                {followers.map((user) => (
                  <Link key={user.username} href={`/profile/${user.username}`} className="text-decoration-none text-center">
                    <div>
                      <Image
                        src={user.avatar_url || '/images/default-avatar.png'}
                        alt={user.username}
                        width={60}
                        height={60}
                        className="rounded-circle border"
                      />
                      <p className="mt-1 small">{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted">No followers yet.</p>
            )}
          </Tab>

          <Tab eventKey="following" title={`Following (${following.length})`}>
            {following.length > 0 ? (
              <div className="d-flex flex-wrap gap-3">
                {following.map((user) => (
                  <Link key={user.username} href={`/profile/${user.username}`} className="text-decoration-none text-center">
                    <div>
                      <Image
                        src={user.avatar_url || '/images/default-avatar.png'}
                        alt={user.username}
                        width={60}
                        height={60}
                        className="rounded-circle border"
                      />
                      <p className="mt-1 small">{user.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted">Not following anyone yet.</p>
            )}
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}

// ─── Activity Tabs ─────────────────────────────
function ActivityTabs({ recent, following }) {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Tabs defaultActiveKey="recent" id="activity-tabs" className="mb-3">
          <Tab eventKey="recent" title="Your Recent Activity">
            {recent.length > 0 ? (
              <ul className="list-unstyled">
                {recent.map((act) => (
                  <li key={act.id || `${act.username}-${act.created_at}`} className="mb-3 border-bottom pb-2">
                    <div>
                      <strong>{act.username}</strong> {act.action}{' '}
                      {act.movie_title && (
                        <Link href={`/genre/${encodeURIComponent(act.source)}/${encodeURIComponent(act.movie_title)}`}>
                          {act.movie_title}
                        </Link>
                      )}
                    </div>
                    <small className="text-muted">{new Date(act.created_at).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No recent activity yet.</p>
            )}
          </Tab>

          <Tab eventKey="following" title="Followers Recent Activity">
            {following.length > 0 ? (
              <ul className="list-unstyled">
                {following.map((act) => (
                  <li key={act.id || `${act.username}-${act.created_at}`} className="mb-3 border-bottom pb-2">
                    <div>
                      <Link href={`/profile/${act.username}`}>
                        <strong>{act.username}</strong>
                      </Link>{' '}
                      {act.action}{' '}
                      {act.movie_title && (
                        <Link href={`/genre/${encodeURIComponent(act.source)}/${encodeURIComponent(act.movie_title)}`}>
                          {act.movie_title}
                        </Link>
                      )}
                    </div>
                    <small className="text-muted">{new Date(act.created_at).toLocaleString()}</small>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No activity from people you follow yet.</p>
            )}
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}

// ─── Movies Tabs ─────────────────────────────
function MovieTabs({ ownedMovies, wantedMovies, seenMovies, ownedCount, wantedCount, seenCount, username }) {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Tabs defaultActiveKey="owned" id="movie-tabs" className="mb-3">
          <Tab eventKey="owned" title={`Owned (${ownedCount})`}>
            <MovieList movies={ownedMovies} username={username} link="mycollection" />
          </Tab>
          <Tab eventKey="wanted" title={`Wanted (${wantedCount})`}>
            <MovieList movies={wantedMovies} username={username} link="wantedformycollection" />
          </Tab>
          <Tab eventKey="seen" title={`Seen (${seenCount})`}>
            <MovieList movies={seenMovies} username={username} link="seenit" />
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}

// ─── Reusable Movie List ─────────────────────────────
function MovieList({ movies, username, link }) {
  if (!movies || movies.length === 0) {
    return <p className="text-muted">No movies yet.</p>;
  }
  return (
    <>
      <div className="d-flex flex-wrap gap-3">
        {movies.map((movie) => (
          <div key={movie.tmdb_id ?? movie.id ?? movie.url} className="text-center">
            <Image
              src={movie.image_url || '/images/default-poster.png'}
              alt={movie.film || movie.title || 'poster'}
              width={80}
              height={120}
              className="border rounded"
            />
          </div>
        ))}
      </div>
      <div className="mt-3 text-center">
        <Link href={`/profile/${username}/${link}`} className="btn btn-outline-primary btn-sm">
          See All
        </Link>
      </div>
    </>
  );
}
