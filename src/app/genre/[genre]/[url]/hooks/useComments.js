"use client";
import { useState, useEffect, useCallback } from "react";

// Helper to build flat comments with replies grouped
function buildFlatComments(data) {
  const topLevel = data.filter(c => !c.parent_id);
  const replies = data.filter(c => c.parent_id);

  // Attach replies to their parent id in a map
  const repliesMap = {};
  replies.forEach(r => {
    if (!repliesMap[r.parent_id]) repliesMap[r.parent_id] = [];
    repliesMap[r.parent_id].push(r);
  });

  // Flattened array: top-level comment followed by its replies
  const flat = [];
  topLevel.forEach(c => {
    flat.push({ ...c, isReply: false });
    if (repliesMap[c.id]) {
      repliesMap[c.id].forEach(r => flat.push({ ...r, isReply: true }));
    }
  });

  return flat;
}

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`);
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(buildFlatComments(data));
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Error fetching comments");
    } finally {
      setLoading(false);
    }
  }, [tmdb_id]);

  const postComment = async (content, parent_id = null) => {
    try {
      const res = await fetch(`/api/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id, content, parent_id }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      const newComment = await res.json();
      setComments(prev => buildFlatComments([...prev, newComment]));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const editComment = async (id, content) => {
    try {
      const res = await fetch(`/api/comments`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content }),
      });
      if (!res.ok) throw new Error("Failed to edit comment");
      setComments(prev =>
        prev.map(c => (c.id === id ? { ...c, content } : c))
      );
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteComment = async id => {
    try {
      const res = await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete comment");
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  useEffect(() => { fetchComments(); }, [fetchComments]);

  return { comments, loading, error, postComment, editComment, deleteComment };
}
