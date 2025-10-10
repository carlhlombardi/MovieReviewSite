"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id, username) {
  const [comments, setComments] = useState([]);

  // ───────────────────────────────
  // Fetch comments (memoized)
  // ───────────────────────────────
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch comments");
      setComments(data);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  }, [tmdb_id]); // ✅ only re-create when tmdb_id changes

  useEffect(() => {
    if (tmdb_id) fetchComments();
  }, [tmdb_id, fetchComments]); // ✅ warning gone

  // ───────────────────────────────
  // Post comment
  // ───────────────────────────────
  const postComment = async (content, parent_id = null) => {
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id, content, parent_id }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      fetchComments();
    } catch (err) {
      console.error(err);
    }
  };

  // (editComment, deleteComment, likeComment same as before)

  return {
    comments,
    postComment,
    editComment,
    deleteComment,
    likeComment,
  };
}
