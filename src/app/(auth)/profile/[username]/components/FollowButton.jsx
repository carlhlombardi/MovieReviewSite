"use client";
import { useState, useEffect } from "react";
import { Button } from "react-bootstrap";

export default function FollowButton({ username }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  // ─────────────────────────────
  // Fetch initial follow status
  // ─────────────────────────────
  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch(`/api/follow/status?username=${username}`);
        const data = await res.json();
        setIsFollowing(data.following);
      } catch (err) {
        console.error("Error fetching follow status:", err);
      }
    }
    if (username) fetchStatus();
  }, [username]);

  // ─────────────────────────────
  // Toggle follow/unfollow
  // ─────────────────────────────
  const onFollowToggle = async () => {
    try {
      setLoading(true);
      const method = isFollowing ? "DELETE" : "POST";

      const res = await fetch(`/api/follow`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingUsername: username }),
      });

      if (!res.ok) throw new Error("Request failed");

      setIsFollowing(!isFollowing);
    } catch (err) {
      console.error("Follow toggle failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className="mt-3"
      onClick={onFollowToggle}
      disabled={loading}
      variant={isFollowing ? "secondary" : "primary"}
    >
      {loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
