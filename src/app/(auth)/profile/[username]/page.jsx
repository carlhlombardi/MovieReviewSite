'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Alert, Spinner, Card, Button, Form } from 'react-bootstrap';
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

  // ✅ NEW: Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(0);

  /** ✅ Unified profile fetcher */
  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);

      // Who is logged in
      let authUser = null;
      const authRes = await fetch('/api/auth/profile', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (authRes.ok) {
        authUser = await authRes.json();
        setLoggedInUser(authUser);
      } else {
        setLoggedInUser(null);
      }

      // Which profile are we viewing
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

      // ✅ Fetch follow info if not self
      if (authUser && profileUsername !== authUser.username) {
        const followRes = await fetch(`/api/users/${profileUsername}/follow-status`, {
          credentials: 'include',
        });
        if (followRes.ok) {
          const { following, followersCount } = await followRes.json();
          setIsFollowing(following);
          setFollowCount(followersCount);
        }
      } else {
        // your own follower count
        const countRes = await fetch(`/api/users/${profileUsername}/follow-count`);
        if (countRes.ok) {
          const { followersCount } = await countRes.json();
          setFollowCount(followersCount);
        }
      }
    } catch (err) {
      console.error('Error in profile fetch:', err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [router, profileUsername]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const isSelf =
    loggedInUser && profile && loggedInUser.username === profile.username;

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
      await res.json();
      await fetchProfile();
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading profile&hellip;</p>
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

          {/* ✅ Follow / Unfollow button */}
          {!isSelf && (
            <div className="mt-3">
              <Button
                variant={isFollowing ? 'outline-danger' : 'primary'}
                onClick={async () => {
                  try {
                    const method = isFollowing ? 'DELETE' : 'POST';
                    const res = await fetch('/api/follow', {
                      method,
                      credentials: 'include',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ followingId: profile.id }),
                    });
                    if (res.ok) {
                      setIsFollowing(!isFollowing);
                      setFollowCount((prev) => prev + (isFollowing ? -1 : 1));
                    } else {
                      const data = await res.json();
                      alert(data.error || 'Failed to update follow status');
                    }
                  } catch (err) {
                    console.error('Follow/unfollow failed:', err);
                  }
                }}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
              <p className="mt-2 text-muted">
                {followCount} follower{followCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}

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
                {saving ? 'Saving' : 'Save Changes'}
              </Button>
            </>
          )}
        </Card.Body>
      </Card>

      {/* ✅ Collection Links */}
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
