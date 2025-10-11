"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Fetch all comments ──
  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch comments");
      setComments(data);
    } catch (err) {
      console.error("fetchComments error:", err);
      setError(err.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [tmdb_id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ── Post a comment ──
  const postComment = async (content, parent_id = null) => {
    if (!content) return;
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id, content, parent_id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to post comment");
      setComments((prev) => [data, ...prev]);
      return data;
    } catch (err) {
      console.error("postComment error:", err);
      throw err;
    }
  };

  // ── Edit a comment ──
  const editComment = async (id, content) => {
    try {
      const res = await fetch("/api/comments", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to edit comment");
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, content, updated_at: new Date().toISOString() } : c))
      );
      return data;
    } catch (err) {
      console.error("editComment error:", err);
      throw err;
    }
  };

  // ── Delete a comment ──
  const deleteComment = async (id) => {
    try {
      const res = await fetch(`/api/comments?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete comment");
      setComments((prev) => prev.filter((c) => c.id !== id));
      return data;
    } catch (err) {
      console.error("deleteComment error:", err);
      throw err;
    }
  };

  // ── Like / Unlike ──
  const likeComment = async (id) => {
    try {
      const res = await fetch(`/api/comments/like?id=${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to like comment");
      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, like_count: data.like_count, likedByUser: data.likedByUser } : c))
      );
      return data;
    } catch (err) {
      console.error("likeComment error:", err);
      throw err;
    }
  };

  return { comments, loading, error, fetchComments, postComment, editComment, deleteComment, likeComment };
}
