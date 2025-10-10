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
        cache: "no-store", // ✅ always get fresh comments
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch comments");

      setComments(data);
    } catch (err) {
      console.error("❌ fetchComments error:", err);
    }
  }, [tmdb_id]);

  // ───────────────────────────────
  // Fetch comments on mount / id change
  // ───────────────────────────────
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // ───────────────────────────────
  // Post new comment
  // ───────────────────────────────
const postComment = async (content, parent_id = null) => {
  console.log("🟡 postComment called with:", {
    tmdb_id,
    username,
    content,
    parent_id,
  });

  if (!content?.trim()) {
    console.error("🚫 Empty comment text");
    return;
  }

  const res = await fetch("/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tmdb_id, username, content, parent_id }),
  });

  const data = await res.json();
  console.log("🟢 POST response:", res.status, data);
};


  // ───────────────────────────────
  // Edit comment
  // ───────────────────────────────
  const editComment = useCallback(
    async (id, content) => {
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
    },
    [fetchComments]
  );

  // ───────────────────────────────
  // Delete comment
  // ───────────────────────────────
  const deleteComment = useCallback(
    async (id) => {
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
    },
    [fetchComments]
  );

  // ───────────────────────────────
  // Like comment
  // ───────────────────────────────
  const likeComment = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/comments/like?id=${id}`, {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to like comment");

      // ✅ Update like count in UI immediately
      setComments((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, like_count: data.like_count } : c
        )
      );
    } catch (err) {
      console.error("❌ likeComment error:", err);
    }
  }, []);

  return {
    comments,
    fetchComments,
    postComment,
    editComment,
    deleteComment,
    likeComment,
  };
}
