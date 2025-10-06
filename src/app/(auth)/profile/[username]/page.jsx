"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Spinner, Card, Button } from "react-bootstrap";
import Image from "next/image"; // ✅ Import Next.js Image

export default function ProfilePage() {
  const router = useRouter();
  const { username: profileUsername } = useParams();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // Profile – cookie is automatically sent
        const profileRes = await fetch("/api/auth/profile", {
          credentials: "include", // <--- important for cookies
        });

        if (profileRes.status === 401) {
          router.push("/login");
          return;
        }

        if (!profileRes.ok) {
          throw new Error("Failed to fetch profile");
        }

        const profileData = await profileRes.json();
        setProfile(profileData);
      } catch (err) {
        console.error("Error in profile fetch:", err);
        setError(err.message || "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAll();
  }, [router]);

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

  const isSelf = profile.username === profileUsername;

  return (
    <div className="container mt-5">
      <h2 className="mb-4 d-flex justify-content-between align-items-center">
        {isSelf
          ? `Welcome back, ${profile.firstname}!`
          : `Profile of ${profileUsername}`}
        {isSelf && (
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => router.push("/profile/edit")}
          >
            Edit Profile
          </Button>
        )}
      </h2>

      <Card className="mb-4 p-3 text-center">
        {/* ✅ Avatar */}
        {profile.avatar_url ? (
          <Image
            src={profile.avatar_url}
            alt={`${profile.username}'s avatar`}
            width={120}
            height={120}
            style={{ objectFit: "cover", borderRadius: "50%" }}
          />
        ) : (
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              backgroundColor: "#ddd",
              display: "inline-block",
            }}
          ></div>
        )}
        <h4 className="mt-3">{profile.username}</h4>
        {profile.bio && <p className="mt-2">{profile.bio}</p>}
      </Card>

      <Card className="mb-4">
        <Card.Header as="h5">Profile Details</Card.Header>
        <Card.Body>
          <p>
            <strong>Username:</strong> {profile.username}
          </p>
          <p>
            <strong>Date Joined:</strong>{" "}
            {new Date(profile.date_joined).toLocaleDateString()}
          </p>
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
