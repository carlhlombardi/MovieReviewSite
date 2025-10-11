"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Build tree of comments (for replies)
  const buildCommentTree = useCallback((flatComments) => {
    const map = {};
    const roots = [];

    flatComments.forEach(c => {
      map[c.id] = { ...c, replies: [] };
    });

    flatComments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].replies.push(map[c.id]);
      } else if (!c.parent_id) {
        roots.push(map[c.id]);
      }
    });

    return roots;
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(buildCommentTree(data));
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching comments");
    } finally {
      setLoading(false);
    }
  }, [tmdb_id, buildCommentTree]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Flatten comments + replies for easier rerender
  const flattenComments = useCallback((commentTree) => {
    const result = [];
    commentTree.forEach(c => {
      result.push(c);
      if (c.replies?.length) result.push(...flattenComments(c.replies));
    });
    return result;
  }, []);

  const postComment = async (content, parent_id = null) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id, content, parent_id })
    });
    if (!res.ok) throw new Error("Failed to add comment");
    await fetchComments(); // refresh
  };

  const editComment = async (id, content) => {
    const res = await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content })
    });
    if (!res.ok) throw new Error("Failed to edit comment");
    await fetchComments();
  };

  const deleteComment = async (id) => {
    const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete comment");
    await fetchComments();
  };

  return {
    comments,
    loading,
    error,
    fetchComments,
    postComment,
    editComment,
    deleteComment,
    flattenComments
  };
}
