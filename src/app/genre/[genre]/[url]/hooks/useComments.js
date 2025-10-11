"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch comments");

      // Build top-level comments only (YouTube style)
      setComments(data.filter(c => !c.parent_id));
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [tmdb_id]);

  const postComment = async (content, parent_id = null) => {
    if (!content) return;
    const res = await fetch("/api/comments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id, content, parent_id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to post comment");

    return data;
  };

  const editComment = async (id, content) => {
    const res = await fetch("/api/comments", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to edit comment");
    return data;
  };

  const deleteComment = async (id) => {
    const res = await fetch(`/api/comments?id=${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to delete comment");
    return data;
  };

  const likeComment = async (id) => {
    const res = await fetch(`/api/comments/like?id=${id}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to like comment");
    return data;
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    error,
    fetchComments,
    postComment,
    editComment,
    deleteComment,
    likeComment,
    setComments,
  };
}
