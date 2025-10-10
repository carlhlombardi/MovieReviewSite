"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id, username) {
  const [comments, setComments] = useState([]);

  // ───────────────────────────────
  // Fetch all comments
  // ───────────────────────────────
  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;

    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, {
        credentials: "include", // ✅ send cookies
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to fetch comments");
      setComments(data);
    } catch (err) {
      console.error("❌ fetchComments error:", err);
    }
  }, [tmdb_id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ───────────────────────────────
  // Post a new comment
  // ───────────────────────────────
  const postComment = async (content, parent_id = null) => {
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ send cookies
        body: JSON.stringify({ tmdb_id, content, parent_id }),
      });

      if (!res.ok) throw new Error("Failed to post comment");
      await fetchComments();
    } catch (err) {
      console.error("❌ postComment error:", err);
    }
  };

  // ───────────────────────────────
  // Edit a comment
  // ───────────────────────────────
  const editComment = async (id, content) => {
    try {
      const res = await fetch("/api/comments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, content }),
      });

      if (!res.ok) throw new Error("Failed to edit comment");
      await fetchComments();
    } catch (err) {
      console.error("❌ editComment error:", err);
    }
  };

  // ───────────────────────────────
  // Delete a comment
  // ───────────────────────────────
  const deleteComment = async (id) => {
    try {
      const res = await fetch(`/api/comments?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to delete comment");
      await fetchComments();
    } catch (err) {
      console.error("❌ deleteComment error:", err);
    }
  };

  // ───────────────────────────────
  // Like a comment
  // ───────────────────────────────
  const likeComment = async (id) => {
    try {
      const res = await fetch(`/api/comments/like?id=${id}`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to like comment");
      const data = await res.json();

      setComments((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, like_count: data.like_count } : c
        )
      );
    } catch (err) {
      console.error("❌ likeComment error:", err);
    }
  };

  return {
    comments,
    fetchComments,
    postComment,
    editComment,
    deleteComment,
    likeComment,
  };
}
