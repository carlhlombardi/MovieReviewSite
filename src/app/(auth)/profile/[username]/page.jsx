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

  const [recentActivity, setRecentActivity] = useState([]);
  const [followingActivity, setFollowingActivity] = useState([]);

  const isSelf = loggedInUser && profile && loggedInUser.username === profile.username;

  // ───────────────────────────
  // Fetch followers/following
  // ───────────────────────────
  const fetchFollowLists = useCallback(async (username) => {
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetch(`/api/user/followers?username=${username}`, { cache: 'no-store' }),
        fetch(`/api/user/following?username=${username}`, { cache: 'no-store' }),
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

      setRecentActivity(recentData.feed || []);
      setFollowingActivity(followingData.feed || []);
    } catch (err) {
      console.error('Error fetching activity feed:', err);
    }
  }, []);

  // ───────────────────────────
  // Fetch follow status
  // ───────────────────────────
  const fetchFollowStatus = useCallback(async (targetUsername) => {
    try {
      const res = await fetch(`/api/users/${targetUsername}/follow-status`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) return;
      const data = await res.json();
      setIsFollowing(data.following || false);
    } catch (err) {
      console.error('Error fetching follow status:', err);
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

      const authRes = await fetch('/api/auth/profile', { credentials: 'include', cache: 'no-store' });
      let authUser = null;
      if (authRes.ok) authUser = await authRes.json();
      setLoggedInUser(authUser);

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

      if (authUser && profileData.username !== authUser.username) {
        await fetchFollowStatus(profileData.username);
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
  }, [profileUsername, router, fetchFollowLists, fetchMovieLists, fetchActivityFeed, fetchFollowStatus]);

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
        fetchFollowLists(profile.username);
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err);
      setError('Follow/unfollow failed');
    }
  };

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

      {/* Activity */}

{!isSelf && loggedInUser && (
<ActivityTabs recent={recentActivity} following={followingActivity} />
          )}

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
                  <li key={act.id} className="mb-3 border-bottom pb-2">
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
                  <li key={act.id} className="mb-3 border-bottom pb-2">
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
        <Link href={`/profile/${username}/${link}`} className="btn btn-outline-primary btn-sm">
          See All
        </Link>
      </div>
    </>
  );
}
