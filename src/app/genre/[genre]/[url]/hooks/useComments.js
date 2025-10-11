"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Helper: nest flat comments into a tree ──
  const nestComments = (flat) => {
    const map = {};
    flat.forEach(c => (map[c.id] = { ...c, replies: [] }));
    const nested = [];
    flat.forEach(c => {
      if (c.parent_id) {
        if (map[c.parent_id]) map[c.parent_id].replies.push(map[c.id]);
      } else {
        nested.push(map[c.id]);
      }
    });
    return nested;
  };

  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch comments");

      setComments(Array.isArray(data) ? nestComments(data) : []);
    } catch (err) {
      console.error("❌ fetchComments error:", err);
      setError(err.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [tmdb_id]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

// ── Post a new comment ──
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

    // ── Optimistic update ──
    const newComment = {
      id: data.id,           // make sure backend returns the new comment id
      content,
      username: data.username || "You",
      created_at: new Date().toISOString(),
      replies: [],
      like_count: 0,
      likedByUser: false,
      parent_id: parent_id || null,
    };

    if (parent_id) {
      // Add as a reply to parent
      setComments((prev) =>
        prev.map((c) =>
          c.id === parent_id
            ? { ...c, replies: [...(c.replies || []), newComment] }
            : c
        )
      );
    } else {
      // Add as a top-level comment
      setComments((prev) => [newComment, ...prev]);
    }

    return newComment;
  } catch (err) {
    console.error("❌ postComment error:", err);
    throw err;
  }
};


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

      // Update local state
      const update = (list) =>
        list.map(c =>
          c.id === id
            ? { ...c, content }
            : { ...c, replies: update(c.replies) }
        );
      setComments(prev => update(prev));

      return data;
    } catch (err) {
      console.error("❌ editComment error:", err);
      throw err;
    }
  };

  const deleteComment = async (id) => {
    try {
      const res = await fetch(`/api/comments?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete comment");

      // Remove locally
      const remove = (list) =>
        list
          .filter(c => c.id !== id)
          .map(c => ({ ...c, replies: remove(c.replies) }));
      setComments(prev => remove(prev));

      return data;
    } catch (err) {
      console.error("❌ deleteComment error:", err);
      throw err;
    }
  };

  const likeComment = async (id) => {
    try {
      const res = await fetch(`/api/comments/like?id=${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to like comment");

      const update = (list) =>
        list.map(c =>
          c.id === id
            ? { ...c, like_count: data.like_count, likedByUser: data.likedByUser }
            : { ...c, replies: update(c.replies) }
        );
      setComments(prev => update(prev));

      return data;
    } catch (err) {
      console.error("❌ likeComment error:", err);
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
    likeComment,
  };
}
