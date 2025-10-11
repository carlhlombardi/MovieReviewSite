"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ──────────────────────────────
  // Fetch comments
  // ──────────────────────────────
  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch comments");
      setComments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tmdb_id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ──────────────────────────────
  // Post a new comment
  // ──────────────────────────────
  const postComment = async (content, parent_id = null) => {
    if (!content.trim()) return;
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id, content, parent_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add comment");
      // Prepend new comment for top-level
      setComments((prev) => [...prev, data]);
    } catch (err) {
      throw err;
    }
  };

  // ──────────────────────────────
  // Edit a comment
  // ──────────────────────────────
  const editComment = async (id, content) => {
    try {
      const res = await fetch("/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to edit comment");
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, content } : c))
      );
    } catch (err) {
      throw err;
    }
  };

  // ──────────────────────────────
  // Delete a comment
  // ──────────────────────────────
  const deleteComment = async (id) => {
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete comment");
      setComments((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      throw err;
    }
  };

  return {
    comments,
    loading,
    error,
    fetchComments,
    postComment,
    editComment,
    deleteComment,
  };
}
