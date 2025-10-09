'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Alert, Spinner, Card, Button, Form, Tabs, Tab } from 'react-bootstrap';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { username: profileUsername } = useParams();
  const fileInputRef = useRef(null);

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
  // Fetch profile
  // ───────────────────────────
  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      setError('');

      if (!profileUsername) {
        router.replace('/login');
        return;
      }

      // who is logged in
      const authRes = await fetch('/api/auth/profile', {
        credentials: 'include',
        cache: 'no-store',
      });
      let authUser = null;
      if (authRes.ok) authUser = await authRes.json();
      setLoggedInUser(authUser);

      // which profile
      let profileRes;
      if (authUser && profileUsername === authUser.username) {
        profileRes = await fetch('/api/auth/profile', {
          credentials: 'include',
          cache: 'no-store',
        });
      } else {
        profileRes = await fetch(`/api/users/${profileUsername}`, {
          cache: 'no-store',
        });
      }

      if (profileRes.status === 401) {
        router.replace('/login');
        return;
      }
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();

      setProfile(profileData);
      setAvatarUrl(profileData.avatar_url || '');
      setBio(profileData.bio || '');

      // check follow status
      if (authUser && profileData && authUser.username !== profileData.username) {
        const followCheck = await fetch(
          `/api/follow/status?followingUsername=${profileData.username}`,
          { credentials: 'include' }
        );
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
  };

  // ───────────────────────────
  // Fetch followers/following
  // ───────────────────────────
  const fetchFollowLists = async (username) => {
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
  };

  // ───────────────────────────
  // Fetch movie lists
  // ───────────────────────────
  const fetchMovieLists = async (username) => {
    try {
      const [ownedRes, wantedRes, seenRes] = await Promise.all([
        fetch(`/api/auth/profile/${username}/mycollection?limit=5`),
        fetch(`/api/auth/profile/${username}/wantedforcollection?limit=5`),
        fetch(`/api/auth/profile/${username}/seenit?limit=5`),
      ]);

      const ownedData = await ownedRes.json();
      const wantedData = await wantedRes.json();
      const seenData = await seenRes.json();

      setOwnedMovies((ownedData.movies || []).slice(0, 6));
      setWantedMovies((wantedData.movies || []).slice(0, 6));
      setSeenMovies((seenData.movies || []).slice(0, 6));

      setOwnedCount(ownedData.movies?.length || 0);
      setWantedCount(wantedData.movies?.length || 0);
      setSeenCount(seenData.movies?.length || 0);
    } catch (err) {
      console.error('Error fetching movie lists:', err);
    }
  };

  // ───────────────────────────
  // Fetch activity feed
  // ───────────────────────────
const fetchActivityFeed = async (username) => {
  try {
    const [recentRes, followingRes] = await Promise.all([
      fetch(`/api/activity/feed/${username}?limit=5`, { cache: 'no-store' }),
      fetch(`/api/activity/following/${username}?limit=5`, { cache: 'no-store' }),
    ]);

    if (!recentRes.ok || !followingRes.ok) {
      console.error('❌ Error fetching activity feed');
      return;
    }

    const recentData = await recentRes.json();
    const followingData = await followingRes.json();

    // ⬇️ Limit to last 5 on the client side too (extra safety)
    setRecentActivity((recentData.feed || []).slice(0, 5));
    setFollowingActivity((followingData.feed || []).slice(0, 5));
  } catch (err) {
    console.error('❌ Error fetching activity feed:', err);
  }
};
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
      const withTs = `${newUrl}?t=${Date.now()}`;
      setAvatarUrl(withTs);

      await fetch('/api/auth/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: newUrl, bio }),
      });

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
        const text = await res.text();
        throw new Error(text);
      }

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [profileUsername]);
  // ───────────────────────────
  // UI
  // ───────────────────────────
  if (isLoading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading profile…</p>
      </div>
    );

  if (error)
    return (
      <Alert variant="danger" className="mt-5">
        {error}
      </Alert>
    );

  if (!profile)
    return (
      <Alert variant="warning" className="mt-5">
        Profile not found.
      </Alert>
    );

  return (
    <div className="container mt-5">
      <h2>
        {isSelf
          ? `Welcome back, ${profile.firstname || profile.username}`
          : `Profile of ${profile.username}`}
      </h2>

      {/* ─────────── Profile Card ─────────── */}
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
            onClick={() => {
              if (isSelf && fileInputRef.current) fileInputRef.current.click();
            }}
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
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleAvatarUpload(file);
              }}
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

              <Button
                className="mt-3"
                onClick={handleSave}
                disabled={saving}
                variant="primary"
              >
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

      {/* ─────────── Followers / Following ─────────── */}
      <Card className="mb-4">
        <Card.Body>
          <Tabs defaultActiveKey="followers" id="profile-tabs" className="mb-3">
            <Tab eventKey="followers" title={`Followers (${followers.length})`}>
              <div className="d-flex flex-wrap gap-3">
                {followers.length > 0 ? (
                  followers.map((user) => (
                    <Link
                      href={`/profile/${user.username}`}
                      key={user.username}
                      className="text-center text-decoration-none"
                    >
                      <Image
                        src={user.avatar_url || '/images/default-avatar.png'}
                        alt={user.username}
                        width={60}
                        height={60}
                        className="rounded-circle border"
                      />
                      <p className="small mt-1">{user.username}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-muted">No followers yet.</p>
                )}
              </div>
            </Tab>

            <Tab eventKey="following" title={`Following (${following.length})`}>
              <div className="d-flex flex-wrap gap-3">
                {following.length > 0 ? (
                  following.map((user) => (
                    <Link
                      href={`/profile/${user.username}`}
                      key={user.username}
                      className="text-center text-decoration-none"
                    >
                      <Image
                        src={user.avatar_url || '/images/default-avatar.png'}
                        alt={user.username}
                        width={60}
                        height={60}
                        className="rounded-circle border"
                      />
                      <p className="small mt-1">{user.username}</p>
                    </Link>
                  ))
                ) : (
                  <p className="text-muted">Not following anyone yet.</p>
                )}
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* ─────────── Activity Feed Tabs ─────────── */}
      {loggedInUser && (
        <Card className="mb-4">
          <Card.Body>
            <Tabs defaultActiveKey="recent" id="activity-tabs" className="mb-3">
              {/* ─────────────── Recent Activity ─────────────── */}
              <Tab eventKey="recent" title="Recent Activity">
                {recentActivity.length > 0 ? (
                  <ul className="list-unstyled">
                    {recentActivity.map((act, idx) => (
                      <li key={idx} className="mb-2 border-bottom pb-2">
                        <strong>{act.username || `User #${act.user_id}`}</strong>{' '}
                        {act.action}
                        {act.movie_title ? `: "${act.movie_title}"` : ''}{' '}
                        <span className="text-muted small">
                          {act.created_at && !isNaN(new Date(act.created_at))
                            ? new Date(act.created_at).toLocaleString()
                            : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No recent activity.</p>
                )}
              </Tab>

              {/* ─────────────── Following Activity ─────────────── */}
              <Tab eventKey="followingactivity" title="Following Activity">
                {followingActivity.length > 0 ? (
                  <ul className="list-unstyled">
                    {followingActivity.map((act, idx) => (
                      <li key={idx} className="mb-2 border-bottom pb-2">
                        <strong>{act.username || `User #${act.user_id}`}</strong>{' '}
                        {act.action}
                        {act.movie_title ? `: "${act.movie_title}"` : ''}{' '}
                        <span className="text-muted small">
                          {act.created_at && !isNaN(new Date(act.created_at))
                            ? new Date(act.created_at).toLocaleString()
                            : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted">No activity from following users.</p>
                )}
              </Tab>
            </Tabs>
          </Card.Body>
        </Card>
      )}
      {/* ─────────── Movies Owned / Wanted / Seen ─────────── */}
      <Card className="mb-4">
        <Card.Body>
          <Tabs defaultActiveKey="owned" id="movie-tabs" className="mb-3">
            {/* OWNED */}
            <Tab eventKey="owned" title={`Owned (${ownedCount})`}>
              {ownedMovies.length > 0 ? (
                <>
                  <div className="d-flex flex-wrap gap-3">
                    {ownedMovies.map((movie) => (
                      <div key={movie.id} className="text-center">
                        <Image
                          src={movie.image_url || '/images/default-poster.png'}
                          alt={movie.title}
                          width={80}
                          height={120}
                          className="border rounded"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <Link
                      href={`/profile/${profile.username}/mycollection`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      See All
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-muted">No movies owned yet.</p>
              )}
            </Tab>

            {/* WANTED */}
            <Tab eventKey="wanted" title={`Wanted (${wantedCount})`}>
              {wantedMovies.length > 0 ? (
                <>
                  <div className="d-flex flex-wrap gap-3">
                    {wantedMovies.map((movie) => (
                      <div key={movie.id} className="text-center">
                        <Image
                          src={movie.image_url || '/images/default-poster.png'}
                          alt={movie.title}
                          width={80}
                          height={120}
                          className="border rounded"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <Link
                      href={`/profile/${profile.username}/wantedformycollection`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      See All
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-muted">No wanted movies yet.</p>
              )}
            </Tab>

            {/* SEEN */}
            <Tab eventKey="seen" title={`Seen (${seenCount})`}>
              {seenMovies.length > 0 ? (
                <>
                  <div className="d-flex flex-wrap gap-3">
                    {seenMovies.map((movie) => (
                      <div key={movie.id} className="text-center">
                        <Image
                          src={movie.image_url || '/images/default-poster.png'}
                          alt={movie.title}
                          width={80}
                          height={120}
                          className="border rounded"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-center">
                    <Link
                      href={`/profile/${profile.username}/seenit`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      See All
                    </Link>
                  </div>
                </>
              ) : (
                <p className="text-muted">No movies seen yet.</p>
              )}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </div>
  );
}
