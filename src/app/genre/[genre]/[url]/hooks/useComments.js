"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateCommentTree = (list, id, updater) =>
    list.map(c => {
      if (c.id === id) return updater(c);
      if (c.replies?.length) return { ...c, replies: updateCommentTree(c.replies, id, updater) };
      return c;
    });

  const removeCommentFromTree = (list, id) =>
    list.filter(c => c.id !== id).map(c => c.replies?.length ? { ...c, replies: removeCommentFromTree(c.replies, id) } : c);

  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch comments");

      // build nested tree
      const map = {};
      const tree = [];
      data.forEach(c => { c.replies = []; map[c.id] = c; });
      data.forEach(c => c.parent_id ? map[c.parent_id]?.replies.push(c) : tree.push(c));

      setComments(tree);
    } catch (err) {
      console.error("❌ fetchComments error:", err);
      setError(err.message || "Failed to fetch comments");
    } finally {
      setLoading(false);
    }
  }, [tmdb_id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

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

      // append returned comment
      const newComment = { ...data, replies: [] };
      if (parent_id) {
        setComments(prev => updateCommentTree(prev, parent_id, c => ({ ...c, replies: [...c.replies, newComment] })));
      } else {
        setComments(prev => [newComment, ...prev]);
      }

      return newComment;
    } catch (err) {
      console.error("❌ postComment error:", err);
      throw err;
    }
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

    setComments(prev => updateCommentTree(prev, id, c => ({ ...c, content, updated_at: new Date().toISOString() })));
    return data;
  };

  const deleteComment = async (id) => {
    const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE", credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to delete comment");

    setComments(prev => removeCommentFromTree(prev, id));
    return data;
  };

  const likeComment = async (id) => {
    const res = await fetch(`/api/comments/like?id=${id}`, { method: "POST", credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to like comment");

    setComments(prev => updateCommentTree(prev, id, c => ({ ...c, like_count: data.like_count, likedByUser: data.likedByUser })));
    return data;
  };

  return { comments, loading, error, fetchComments, postComment, editComment, deleteComment, likeComment };
}
