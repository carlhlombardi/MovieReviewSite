"use client";
import { Card } from "react-bootstrap";
import Image from "next/image";
import FollowButton from "./FollowButton"; // ✅ import the new component

export default function ProfileHeader({ profile, isSelf }) {
  if (!profile) return null;

  const { username, avatar_url, date_joined, bio } = profile;

  return (
    <Card className="mb-4 p-3 text-center shadow-sm">
      <div
        style={{
          width: 120,
          height: 120,
          margin: "0 auto",
          borderRadius: "50%",
          overflow: "hidden",
          border: "2px solid #ccc",
          backgroundColor: "#f0f0f0",
        }}
      >
        <Image
          src={avatar_url || "/images/default-avatar.png"}
          alt={`${username}'s avatar`}
          width={120}
          height={120}
          style={{ objectFit: "cover" }}
        />
      </div>

      <p className="mt-3 mb-1">
        <strong>Username:</strong> {username}
      </p>
      <p className="mb-1">
        <strong>Date Joined:</strong>{" "}
        {date_joined ? new Date(date_joined).toLocaleDateString() : "Unknown"}
      </p>
      <p className="mt-3">
        <strong>Bio:</strong> {bio || "No bio yet."}
      </p>

      {/* ✅ Only show follow button if viewing someone else’s profile */}
      {!isSelf && username && <FollowButton username={username} />}
    </Card>
  );
}
