'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Alert, Spinner, Card, Button, Form } from 'react-bootstrap';

export default function ProfilePage() {
  const router = useRouter();
  const { username: profileUsername } = useParams();
  const fileInputRef = useRef(null);

  const [loggedInUser, setLoggedInUser] = useState(undefined);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');

  // 1️⃣ fetch logged-in user once
  useEffect(() => {
    (async () => {
      try {
        const authRes = await fetch('/api/auth/profile', {
          credentials: 'include',
        });
        if (authRes.ok) {
          const authUser = await authRes.json();
          setLoggedInUser(authUser);
        } else {
          setLoggedInUser(null);
        }
      } catch (err) {
        console.error(err);
        setLoggedInUser(null);
      }
    })();
  }, []);

  // 2️⃣ fetch the actual profile depending on loggedInUser/profileUsername
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      let profileRes;

      // no username in URL = viewing own profile
      if (!profileUsername) {
        profileRes = await fetch('/api/auth/profile', {
          credentials: 'include',
        });
      } else if (
        loggedInUser &&
        loggedInUser.username === profileUsername
      ) {
        // viewing your own profile even with /profile/[username] URL
        profileRes = await fetch('/api/auth/profile', {
          credentials: 'include',
        });
      } else {
        // viewing someone else’s profile
        profileRes = await fetch(`/api/users/${profileUsername}`);
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
    } catch (err) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, [loggedInUser, profileUsername, router]);

  // refetch profile once we know loggedInUser
  useEffect(() => {
    if (loggedInUser !== undefined) {
      fetchProfile();
    }
  }, [loggedInUser, fetchProfile]);

  const isSelf =
    loggedInUser &&
    profile &&
    loggedInUser.username === profile.username;

  const handleAvatarUpload = async (file) => {
    if (!isSelf) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      setSaving(true);
      setError('');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      const newUrl = data.avatar_url || data.url;
      if (newUrl) {
        // bust cache
        const withTs = `${newUrl}?t=${Date.now()}`;
        setAvatarUrl(withTs);
        // update DB
        await fetch('/api/auth/profile', {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: newUrl, bio }),
        });
        // refresh profile from DB
        await fetchProfile();
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error(err);
      setError('Upload failed');
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
      // refresh profile from DB
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
        <p>Loading profile...</p>
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
          ? `Welcome back, ${profile.firstname || profile.username}!`
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
                key={avatarUrl} // force re-render on URL change
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
            <Form.Group className="mt-2">
              <Form.Label>Edit Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </Form.Group>
          )}

          {isSelf && (
            <Button
              className="mt-3"
              onClick={handleSave}
              disabled={saving}
              variant="primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header as="h5">
          <a
            href={`/profile/${profile.username}/mycollection`}
            className="text-decoration-none"
          >
            Movies Owned — View My Collection
          </a>
        </Card.Header>
      </Card>

      <Card className="mb-4">
        <Card.Header as="h5">
          <a
            href={`/profile/${profile.username}/wantedformycollection`}
            className="text-decoration-none"
          >
            Movies Wanted — View My Wish List
          </a>
        </Card.Header>
      </Card>
    </div>
  );
}
