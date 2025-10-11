"use client";

import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── Helper: add/update/delete recursively for nested replies ──
  const updateCommentTree = (list, id, updater) =>
    list.map((c) => {
      if (c.id === id) return updater(c);
      if (c.replies?.length) return { ...c, replies: updateCommentTree(c.replies, id, updater) };
      return c;
    });

  const removeCommentFromTree = (list, id) =>
    list
      .filter((c) => c.id !== id)
      .map((c) => (c.replies?.length ? { ...c, replies: removeCommentFromTree(c.replies, id) } : c));

  // ── Fetch all comments ──
  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch comments");

      // Build nested tree structure
      const map = {};
      const tree = [];
      data.forEach((c) => {
        c.replies = [];
        map[c.id] = c;
      });
      data.forEach((c) => {
        if (c.parent_id) {
          map[c.parent_id]?.replies.push(c);
        } else {
          tree.push(c);
        }
      });

      setComments(tree);
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

  // ── Post a comment or reply ──
 const postComment = async (content, parent_id = null) => {
  if (!content?.trim()) return;

  try {
    const res = await fetch("/api/comments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id, content: content.trim(), parent_id }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to post comment");

    // ✅ Ensure the API returned the full comment object
    const newComment = {
      id: data.id,
      user_id: data.user_id,
      username: data.username,
      tmdb_id: data.tmdb_id,
      content: data.content,
      parent_id: data.parent_id,
      like_count: data.like_count ?? 0,
      likedByUser: false,
      created_at: data.created_at,
      updated_at: data.updated_at,
      replies: [],
    };

    // Add to tree
    if (parent_id) {
      setComments((prev) =>
        updateCommentTree(prev, parent_id, (c) => ({
          ...c,
          replies: [...c.replies, newComment],
        }))
      );
    } else {
      setComments((prev) => [newComment, ...prev]);
    }

    return newComment;
  } catch (err) {
    console.error("❌ postComment error:", err);
    throw err;
  }
};


  // ── Edit comment ──
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

      setComments((prev) => updateCommentTree(prev, id, (c) => ({ ...c, content, updated_at: new Date().toISOString() })));
      return data;
    } catch (err) {
      console.error("❌ editComment error:", err);
      throw err;
    }
  };

  // ── Delete comment ──
  const deleteComment = async (id) => {
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to delete comment");

      setComments((prev) => removeCommentFromTree(prev, id));
      return data;
    } catch (err) {
      console.error("❌ deleteComment error:", err);
      throw err;
    }
  };

  // ── Like / Unlike ──
  const likeComment = async (id) => {
    try {
      const res = await fetch(`/api/comments/like?id=${id}`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to like comment");

      setComments((prev) =>
        updateCommentTree(prev, id, (c) => ({ ...c, like_count: data.like_count, likedByUser: data.likedByUser }))
      );
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
