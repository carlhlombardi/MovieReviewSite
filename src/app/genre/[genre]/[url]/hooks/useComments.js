"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id, username) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  // ───────────────────────────────
  // Fetch all comments for a movie
  // ───────────────────────────────
  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoading(false);
    }
  }, [tmdb_id]); // ✅ dependency here

  // ✅ Safe, no ESLint warning now
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ───────────────────────────────
  // Post new comment
  // ───────────────────────────────
  const postComment = async (content, parent_id = null) => {
    console.log("🟡 DEBUG postComment payload:", {
      tmdb_id,
      content,
      parent_id,
      username,
    });

    if (!tmdb_id) {
      alert("❌ tmdb_id is missing before sending comment!");
      return;
    }

    if (!content || content.trim() === "") {
      alert("❌ content is missing before sending comment!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tmdb_id, content, parent_id }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Comment failed:", data.error);
        alert(`❌ Comment failed: ${data.error}`);
        setLoading(false);
        return;
      }

      console.log("✅ Comment posted successfully:", data);
      await fetchComments();
    } catch (err) {
      console.error("❌ postComment error:", err);
      alert("❌ Comment failed: Network or unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────
  // Delete comment
  // ───────────────────────────────
  const deleteComment = async (id) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Delete failed:", data.error);
        alert(`❌ Delete failed: ${data.error}`);
        return;
      }

      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("❌ deleteComment error:", err);
    }
  };

  return {
    comments,
    postComment,
    deleteComment,
    fetchComments,
    loading,
  };
}
