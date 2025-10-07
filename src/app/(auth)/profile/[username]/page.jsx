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

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  // Followers / Following lists
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  // ─────────────────────────────────────────────
  // Fetch current profile + logged-in user
  // ─────────────────────────────────────────────
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // 1️⃣ who is logged in
      const authRes = await fetch('/api/auth/profile', {
        credentials: 'include',
        cache: 'no-store',
      });
      let authUser = null;
      if (authRes.ok) authUser = await authRes.json();
      setLoggedInUser(authUser);

      // 2️⃣ which profile to display
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

      if (profileRes.status === 401 && !profileUsername) {
        router.push('/login');
        return;
      }
      if (!profileRes.ok) throw new Error('Failed to fetch profile');
      const profileData = await profileRes.json();

      setProfile(profileData);
      setAvatarUrl(profileData.avatar_url || '');
      setBio(profileData.bio || '');

      // 3️⃣ check follow status (if logged in & viewing someone else)
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

      // 4️⃣ fetch followers and following lists
      await fetchFollowLists(profileData.username);
    } catch (err) {
      console.error('Error in profile fetch:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [router, profileUsername]);

  // ─────────────────────────────────────────────
  // Fetch followers/following lists
  // ─────────────────────────────────────────────
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

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isSelf =
    loggedInUser && profile && loggedInUser.username === profile.username;

  // ─────────────────────────────────────────────
  // Avatar upload (only self)
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // Save profile changes (bio/avatar)
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // Follow / Unfollow logic
  // ─────────────────────────────────────────────
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
        await fetchFollowLists(profile.username); // refresh lists
      }
    } catch (err) {
      console.error('Follow/unfollow failed:', err);
      setError('Follow/unfollow failed');
    }
  };

  // ─────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────
  if (isLoading)
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading profile&hellip;</p>
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

      {/* ─────────── Tabs for Followers / Following ─────────── */}
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

      {/* ─────────── Movie links ─────────── */}
      <Card className="mb-4">
        <Card.Header as="h5">
          <Link
            href={`/profile/${profile.username}/mycollection`}
            className="text-decoration-none"
          >
            {isSelf
              ? 'Movies Owned — View Your Collection'
              : `Movies Owned — View ${profile.username}'s Collection`}
          </Link>
        </Card.Header>
      </Card>

      <Card className="mb-4">
        <Card.Header as="h5">
          <Link
            href={`/profile/${profile.username}/wantedformycollection`}
            className="text-decoration-none"
          >
            {isSelf
              ? 'Movies Wanted — View Your Wish List'
              : `Movies Wanted — View ${profile.username}'s Wish List`}
          </Link>
        </Card.Header>
      </Card>
    </div>
  );
}
