"use client";
import { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";

export default function FollowButton({ username }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  // ─────────────────────────────
  // Fetch initial follow status
  // ─────────────────────────────
  useEffect(() => {
    async function fetchStatus() {
      if (!username) return;

      setStatusLoading(true);
      try {
        const res = await fetch(`/api/follow?type=status&username=${username}`, {
          credentials: "include",
        });

        if (!res.ok) throw new Error("Failed to fetch follow status");

        const data = await res.json();
        setIsFollowing(data.following);
      } catch (err) {
        console.error("Error fetching follow status:", err);
      } finally {
        setStatusLoading(false);
      }
    }

    fetchStatus();
  }, [username]);

  // ─────────────────────────────
  // Toggle follow/unfollow
  // ─────────────────────────────
  const onFollowToggle = async () => {
    if (!username) return;

    try {
      setLoading(true);
      const method = isFollowing ? "DELETE" : "POST";

      const res = await fetch("/api/follow", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingUsername: username }),
      });

      if (!res.ok) throw new Error("Follow toggle failed");

      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // Render button
  // ─────────────────────────────
  if (statusLoading) {
    return (
      <Button className="mt-3" disabled>
        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
        {" "}Loading...
      </Button>
    );
  }

  return (
    <Button
      className="mt-3"
      onClick={onFollowToggle}
      disabled={loading}
      variant={isFollowing ? "secondary" : "primary"}
    >
      {loading ? "Processing..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
