"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`);
    const data = await res.json();
    setComments(data);
    setLoading(false);
  }, [tmdb_id]);

  const addComment = async (content, parent_id = null) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id, content, parent_id }),
    });
    const data = await res.json();
    if (res.ok) {
      if (parent_id) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === parent_id ? { ...c, replies: [data, ...c.replies] } : c
          )
        );
      } else {
        setComments((prev) => [data, ...prev]);
      }
    }
  };

  const likeComment = async (id) => {
    const res = await fetch(`/api/comments/like/${id}`, { method: "POST" });
    if (res.ok) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, like_count: c.like_count + 1 }
            : {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === id ? { ...r, like_count: r.like_count + 1 } : r
                ),
              }
        )
      );
    }
  };

  const editComment = async (id, content) => {
    const res = await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, content }
            : {
                ...c,
                replies: c.replies.map((r) =>
                  r.id === id ? { ...r, content } : r
                ),
              }
        )
      );
    }
  };

  const deleteComment = async (id) => {
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setComments((prev) =>
        prev
          .filter((c) => c.id !== id)
          .map((c) => ({
            ...c,
            replies: c.replies.filter((r) => r.id !== id),
          }))
      );
    }
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    loading,
    addComment,
    likeComment,
    editComment,
    deleteComment,
    fetchComments,
  };
}
