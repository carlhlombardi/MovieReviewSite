"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Button, Alert, Spinner, Card } from "react-bootstrap";
import Image from "next/image"; // ✅ THIS IS REQUIRED

export default function EditProfilePage() {
  const router = useRouter();

  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch current profile to prefill form
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/auth/profile", {
          credentials: "include",
        });

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          throw new Error("Failed to load profile");
        }

        const data = await res.json();
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar_url: avatarUrl,
          bio: bio,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      setSuccess("Profile updated!");
      setTimeout(() => router.push("/profile/me"), 1500);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2>Edit Profile</h2>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="p-3 mt-3">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Avatar URL</Form.Label>
            <Form.Control
              type="url"
              placeholder="https://example.com/avatar.jpg"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
            />
            {avatarUrl && (
              <div className="mt-2">
                <Image
                  src={avatarUrl}
                  alt="Preview"
                  width={100}
                  height={100}
                  style={{
                    objectFit: "cover",
                    borderRadius: "50%",
                  }}
                />
              </div>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Bio</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Tell people about yourself"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </Form.Group>

          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </Form>
      </Card>
    </div>
  );
}
