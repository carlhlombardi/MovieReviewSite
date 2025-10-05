"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Alert, Spinner, Card, Row, Col, Form } from "react-bootstrap";
import Image from "next/image";
import Comments from "@/app/components/footer/comments/comments";

const slugifyGenre = (genre) => {
  return genre?.toString().toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
};

export default function ProfilePage() {
  const router = useRouter();
  const { username: profileUsername } = useParams();

  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [likedMovies, setLikedMovies] = useState([]);
  const [selectedMovieUrl, setSelectedMovieUrl] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        // Profile
        const profileRes = await fetch("/api/auth/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!profileRes.ok) {
          throw new Error("Failed to fetch profile");
        }
        const profileData = await profileRes.json();
        setProfile(profileData);

        // Liked movies
        const likRes = await fetch("/api/auth/liked-movies", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (likRes.ok) {
          const likData = await likRes.json();
          setLikedMovies(likData.likedMovies || []);
        }
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
    return <Alert variant="danger" className="mt-5">{error}</Alert>;
  }

  if (!profile) {
    return <Alert variant="warning" className="mt-5">Profile not found.</Alert>;
  }

  const isSelf = profile.username === profileUsername;

  return (
    <div className="container mt-5">
      <h2>
        {isSelf
          ? `Welcome back, ${profile.firstname}!`
          : `Profile of ${profileUsername}`}
      </h2>

      <Card className="mb-4">
        <Card.Header as="h5">Profile Details</Card.Header>
        <Card.Body>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Date Joined:</strong> {new Date(profile.date_joined).toLocaleDateString()}</p>
        </Card.Body>
      </Card>

      {/* ✅ Movies Owned card now links to mycollection page */}
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

       {/* ✅ Movies Owned card now links to wantedformycollection page */}
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
