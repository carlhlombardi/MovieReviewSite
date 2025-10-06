"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Alert, Spinner, Card, Button, Form } from "react-bootstrap";

/**
 * Profile page
 * - If viewing own profile: editable (avatar + bio)
 * - If viewing another user: read-only
 *
 * Requirements:
 * - /api/auth/profile (GET/PATCH) must accept credentials and return JSON user object
 * - /api/users/[username] (GET) must return public profile JSON
 * - /api/upload must accept multipart/form-data and return { avatar_url: "..."} (and ideally save to DB)
 */

export default function ProfilePage() {
  const router = useRouter();
  const { username: profileUsername } = useParams(); // may be undefined for "own" profile
  const fileInputRef = useRef(null);

  const [loggedInUser, setLoggedInUser] = useState(null); // currently authenticated user (or null)
  const [profile, setProfile] = useState(null); // profile being viewed
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // local editable fields
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  // Fetch profile(s) in a stable function so we can re-use it after updates.
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      // 1) try to fetch currently logged-in user (to know who can edit)
      // We don't redirect on 401 here — we may be viewing another user's profile publicly.
      try {
        const authRes = await fetch("/api/auth/profile", {
          credentials: "include",
          cache: "no-store",
        });
        if (authRes.ok) {
          const authUser = await authRes.json();
          setLoggedInUser(authUser);
        } else {
          setLoggedInUser(null);
        }
      } catch (authErr) {
        // network or server problem for auth check -> treat as not logged-in
        setLoggedInUser(null);
      }

      // 2) fetch the profile to display:
      let profileRes;
      if (profileUsername) {
        // viewing another user's profile (public endpoint)
        profileRes = await fetch(`/api/users/${encodeURIComponent(profileUsername)}`, {
          cache: "no-store",
        });
      } else {
        // viewing own profile
        profileRes = await fetch("/api/auth/profile", {
          credentials: "include",
          cache: "no-store",
        });
      }

      // if trying to view own profile and auth missing -> force login
      if (profileRes.status === 401 && !profileUsername) {
        router.push("/login");
        return;
      }

      if (!profileRes.ok) {
        throw new Error(`Failed to load profile (${profileRes.status})`);
      }

      const profileData = await profileRes.json();

      // set profile + local edit states
      setProfile(profileData);
      setBio(profileData.bio ?? "");
      // append timestamp cache buster so Next/Image fetches newest image
      setAvatarUrl(profileData.avatar_url ? `${profileData.avatar_url}?t=${Date.now()}` : "");
    } catch (err) {
      console.error("fetchProfile error:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  }, [profileUsername, router]);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile]);

  // true only if logged-in user is viewing their own profile
  const isSelf = !!(loggedInUser && profile && loggedInUser.username === profile.username);

  // Upload handler: uploads file to /api/upload which should return { avatar_url }
  // The upload API should also save the avatar_url to the DB (or we'll PATCH after upload).
  const handleAvatarUpload = async (file) => {
    if (!isSelf) return;
    const fd = new FormData();
    fd.append("file", file);

    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: fd,
        credentials: "include", // ensure cookie sent for server side auth in upload route if required
        cache: "no-store",
      });

      const data = await res.json();

      // the upload route might return { avatar_url } or { url } (handle both)
      const newUrl = data.avatar_url || data.url || data.secure_url;
      if (!newUrl) {
        throw new Error(data.error || "Upload failed");
      }

      // set for immediate UI show (add ts to bust caches)
      const withTs = `${newUrl}?t=${Date.now()}`;
      setAvatarUrl(withTs);

      // Persist avatar_url + current bio to DB (PATCH profile)
      const patchRes = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: newUrl, bio }),
      });

      if (!patchRes.ok) {
        // try to parse error message
        const errText = await patchRes.text().catch(() => "");
        throw new Error(`Failed to persist avatar: ${errText || patchRes.status}`);
      }

      // Refresh the profile from DB so other pages see the new avatar + bio
      await fetchProfile();
    } catch (err) {
      console.error("handleAvatarUpload error:", err);
      setError(err.message || "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  // Save bio (and avatar_url if changed)
  const handleSave = async () => {
    if (!isSelf) return;
    try {
      setSaving(true);
      setError("");

      // When avatarUrl contains ?t=..., strip the query before saving to DB
      const avatarToSave = avatarUrl ? avatarUrl.split("?")[0] : null;

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarToSave, bio }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Failed to save (${res.status})`);
      }

      // fetch fresh profile from DB to guarantee UI is in sync
      await fetchProfile();
    } catch (err) {
      console.error("handleSave error:", err);
      setError(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  // handle native file selection (called from hidden input)
  const onFileSelected = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    handleAvatarUpload(f);
    // clear the input so selecting same file again triggers change event if needed
    e.target.value = "";
  };

  // ----- render -----
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
      <h2>{isSelf ? `Welcome back, ${profile.firstname || profile.username}!` : `Profile of ${profile.username}`}</h2>

      <Card className="mb-4 p-3">
        <Card.Body className="text-center">
          {/* Avatar area — when isSelf wrap with label that points to hidden input
              Using label/htmlFor ensures mobile touch opens picker reliably */}
          {isSelf ? (
            <label htmlFor="avatarInput" style={{ cursor: "pointer" }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  margin: "0 auto",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid #ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f0f0f0",
                }}
                title="Click to change avatar"
              >
                {avatarUrl ? (
                  <Image
                    key={avatarUrl} // force re-render when changed
                    src={avatarUrl}
                    alt={`${profile.username}'s avatar`}
                    width={120}
                    height={120}
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span>Click to add avatar</span>
                )}
              </div>
            </label>
          ) : (
            <div
              style={{
                width: 120,
                height: 120,
                margin: "0 auto",
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #ccc",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f0f0f0",
              }}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={`${profile.username}'s avatar`}
                  width={120}
                  height={120}
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <span>No avatar</span>
              )}
            </div>
          )}

          {/* hidden file input (triggered by label). 'capture' helps camera on mobile */}
          {isSelf && (
            <input
              id="avatarInput"
              type="file"
              accept="image/*"
              capture="environment"
              ref={fileInputRef}
              onChange={onFileSelected}
              style={{ display: "none" }}
            />
          )}

          <p className="mt-3"><strong>Username:</strong> {profile.username}</p>
          <p><strong>Date Joined:</strong> {new Date(profile.date_joined).toLocaleDateString()}</p>

          {/* Bio shown like other profile fields */}
          <p className="mt-3"><strong>Bio:</strong> {profile.bio || "No bio yet."}</p>

          {/* If it's your own profile, show edit box + save */}
          {isSelf && (
            <>
              <Form.Group className="mt-2">
                <Form.Label>Edit Bio</Form.Label>
                <Form.Control as="textarea" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
              </Form.Group>

              <div className="mt-3">
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </>
          )}

        </Card.Body>
      </Card>

      {/* Always show links to collections (viewable by anyone) */}
      <Card className="mb-4">
        <Card.Header as="h5">
          <a href={`/profile/${profile.username}/mycollection`} className="text-decoration-none">Movies Owned — View My Collection</a>
        </Card.Header>
      </Card>

      <Card className="mb-4">
        <Card.Header as="h5">
          <a href={`/profile/${profile.username}/wantedformycollection`} className="text-decoration-none">Movies Wanted — View My Wish List</a>
        </Card.Header>
      </Card>
    </div>
  );
}
