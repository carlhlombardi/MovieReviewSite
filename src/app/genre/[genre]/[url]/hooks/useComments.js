"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buildTree = (flat) => {
    const map = {};
    const tree = [];
    flat.forEach((c) => {
      c.replies = [];
      map[c.id] = c;
    });
    flat.forEach((c) => {
      if (c.parent_id) {
        map[c.parent_id]?.replies.push(c);
      } else {
        tree.push(c);
      }
    });
    return tree;
  };

  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch comments");
      setComments(buildTree(data));
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

  // ── Helpers ──
  const updateTree = (list, id, updater) =>
    list.map((c) => {
      if (c.id === id) return updater(c);
      if (c.replies?.length) return { ...c, replies: updateTree(c.replies, id, updater) };
      return c;
    });

  const removeFromTree = (list, id) =>
    list
      .filter((c) => c.id !== id)
      .map((c) => (c.replies?.length ? { ...c, replies: removeFromTree(c.replies, id) } : c));

  // ── Actions ──
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

      const newComment = { ...data, replies: [] };
      setComments((prev) => {
        if (parent_id) {
          return updateTree(prev, parent_id, (c) => ({ ...c, replies: [...c.replies, newComment] }));
        } else {
          return [newComment, ...prev];
        }
      });

      return newComment;
    } catch (err) {
      console.error("❌ postComment error:", err);
      throw err;
    }
  };

  const editComment = async (id, content) => {
    if (!content) return;
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
        updateTree(prev, id, (c) => ({ ...c, content, updated_at: new Date().toISOString() }))
      );
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

      setComments((prev) => removeFromTree(prev, id));
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

      setComments((prev) =>
        updateTree(prev, id, (c) => ({ ...c, like_count: data.like_count, likedByUser: data.likedByUser }))
      );
      return data;
    } catch (err) {
      console.error("❌ likeComment error:", err);
      throw err;
    }
  };

  return { comments, loading, error, fetchComments, postComment, editComment, deleteComment, likeComment };
}
