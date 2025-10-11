"use client";
import { useState, useEffect } from "react";
import { Button, Spinner } from "react-bootstrap";

export default function FollowButton({ username }) {
  const [isFollowing, setIsFollowing] = useState(null); // null = unknown
  const [loading, setLoading] = useState(false);

  // ─────────────────────────────
  // Fetch initial follow status
  // ─────────────────────────────
  useEffect(() => {
    if (!username) return;

    fetch(`/api/follow?type=status&username=${username}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setIsFollowing(data.following))
      .catch((err) => {
        console.error("Error fetching follow status:", err);
        setIsFollowing(false); // fallback
      });
  }, [username]);

  // ─────────────────────────────
  // Toggle follow/unfollow (optimistic)
  // ─────────────────────────────
  const onFollowToggle = async () => {
    if (isFollowing === null) return; // don't toggle until we know status

    const newStatus = !isFollowing;
    setIsFollowing(newStatus); // optimistic update
    setLoading(true);

    try {
      const method = newStatus ? "POST" : "DELETE";
      const res = await fetch("/api/follow", {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingUsername: username }),
      });

      if (!res.ok) throw new Error("Follow toggle failed");
    } catch (err) {
      console.error("Follow toggle failed:", err);
      setIsFollowing(!newStatus); // revert on error
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────
  // Render button
  // ─────────────────────────────
  if (isFollowing === null) {
    // still loading initial status, show skeleton
    return (
      <Button className="mt-3" disabled>
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
        />
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
