"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Build tree from flat comments
  const buildCommentTree = useCallback((flatComments) => {
    const map = {};
    const roots = [];

    flatComments.forEach(c => { map[c.id] = { ...c, replies: [] }; });

    flatComments.forEach(c => {
      if (c.parent_id) {
        if (map[c.parent_id]) map[c.parent_id].replies.push(map[c.id]);
      } else {
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
  
  const postComment = async (content, parent_id = null) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id, content, parent_id }),
    });

    if (!res.ok) throw new Error("Failed to add comment");
    const newComment = await res.json();

    setComments(prev => buildCommentTree([...flattenComments(prev), newComment]));
  };

  const editComment = async (id, content) => {
    const res = await fetch("/api/comments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content }),
    });
    if (!res.ok) throw new Error("Failed to edit comment");

    // Update locally
    setComments(prev => updateCommentContent(prev, id, content));
  };

  const deleteComment = async (id) => {
    const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete comment");

    // Remove locally
    setComments(prev => removeComment(prev, id));
  };

  // Helpers to update local state
  const flattenComments = (commentTree) => {
    const result = [];
    const traverse = (nodes) => {
      nodes.forEach(n => {
        const { replies, ...rest } = n;
        result.push(rest);
        if (replies?.length) traverse(replies);
      });
    };
    traverse(commentTree);
    return result;
  };

  const updateCommentContent = (tree, id, content) => {
    return tree.map(c => {
      if (c.id === id) return { ...c, content };
      if (c.replies?.length) return { ...c, replies: updateCommentContent(c.replies, id, content) };
      return c;
    });
  };

  const removeComment = (tree, id) => {
    return tree
      .filter(c => c.id !== id)
      .map(c => ({
        ...c,
        replies: c.replies ? removeComment(c.replies, id) : [],
      }));
  };

  return { comments, loading, error, fetchComments, postComment, editComment, deleteComment };
}
