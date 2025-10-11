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

      // Separate root comments and replies
      const roots = [];
      const map = {};
      data.forEach(c => { c.replies = []; map[c.id] = c; });
      data.forEach(c => {
        if (c.parent_id) map[c.parent_id]?.replies.push(c);
        else roots.push(c);
      });

      setComments(roots);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to fetch comments");
    } finally { setLoading(false); }
  }, [tmdb_id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

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

    data.replies = [];
    if (parent_id) {
      setComments(prev =>
        prev.map(c => c.id === parent_id ? { ...c, replies: [...c.replies, data] } : c)
      );
    } else {
      setComments(prev => [data, ...prev]);
    }
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
    setComments(prev => prev.map(c => c.id === id ? { ...c, content } : {
      ...c, replies: c.replies.map(r => r.id === id ? { ...r, content } : r)
    }));
    return data;
  };

  const deleteComment = async (id) => {
    const res = await fetch(`/api/comments?id=${id}`, {
      method: "DELETE",
      credentials: "include"
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Failed to delete comment");
    setComments(prev => prev.filter(c => c.id !== id).map(c => ({ ...c, replies: c.replies.filter(r => r.id !== id) })));
    return data;
  };

  return { comments, loading, error, fetchComments, postComment, editComment, deleteComment };
}
