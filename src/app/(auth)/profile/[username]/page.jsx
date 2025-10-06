"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { Alert, Spinner, Card, Button, Form } from "react-bootstrap";

export default function ProfilePage() {
  const router = useRouter();
  const { username: profileUsername } = useParams();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        let profileRes;

        // when on someone else's page
        if (profileUsername) {
          profileRes = await fetch(`/api/users/${profileUsername}`, {
            credentials: "include",
          });
        } else {
          // fallback to own profile
          profileRes = await fetch("/api/auth/profile", {
            credentials: "include",
          });
        }

        if (profileRes.status === 401) {
          router.push("/login");
          return;
        }

        if (!profileRes.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData = await profileRes.json();
        setProfile(profileData);
        setAvatarUrl(profileData.avatar_url || "");
        setBio(profileData.bio || "");
      } catch (err) {
        console.error("Error in profile fetch:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [router, profileUsername]);

  const handleAvatarUpload = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      setSaving(true);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setAvatarUrl(data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: avatarUrl, bio }),
      });

      if (!res.ok) throw new Error("Failed to update profile");

      const updated = await res.json();
      setProfile(updated);
      setAvatarUrl(updated.avatar_url || "");
      setBio(updated.bio || "");
    } catch (err) {
      setError(err.message || "Something went wrong");
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

  // true if we are looking at our own profile
  const isSelf = profile.username === profileUsername;

  return (
    <div className="container mt-5">
      <h2>
        {isSelf
          ? `Welcome back, ${profile.firstname}!`
          : `Profile of ${profileUsername}`}
      </h2>

      <Card className="mb-4 p-3">
        <Card.Body className="text-center">
          {avatarUrl && (
            <div style={{ width: 120, height: 120, margin: "0 auto" }}>
              <Image
                src={avatarUrl}
                alt={`${profile.username}'s avatar`}
                width={120}
                height={120}
                style={{
                  objectFit: "cover",
                  borderRadius: "50%",
                }}
              />
            </div>
          )}

          {isSelf && (
            <Form.Group className="mt-3">
              <Form.Label>Change Avatar</Form.Label>
              <Form.Control
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) handleAvatarUpload(file);
                }}
              />
            </Form.Group>
          )}

          <p className="mt-3">
            <strong>Username:</strong> {profile.username}
          </p>
          <p>
            <strong>Date Joined:</strong>{" "}
            {new Date(profile.date_joined).toLocaleDateString()}
          </p>

          {isSelf ? (
            <Form.Group className="mt-3">
              <Form.Label>Bio</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </Form.Group>
          ) : (
            <p>
              <strong>Bio:</strong> {profile.bio}
            </p>
          )}

          {isSelf && (
            <Button
              className="mt-3"
              onClick={handleSave}
              disabled={saving}
              variant="primary"
            >
              {saving ? "Saving..." : "Save Changes"}
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
