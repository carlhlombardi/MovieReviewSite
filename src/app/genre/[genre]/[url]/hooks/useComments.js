"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id) {
  const [comments, setComments] = useState([]);

  // 🔹 Build nested tree
  const buildTree = useCallback((list) => {
    const map = {};
    const roots = [];

    list.forEach((item) => (map[item.id] = { ...item, replies: [] }));
    list.forEach((item) => {
      if (item.parent_id) map[item.parent_id]?.replies.push(map[item.id]);
      else roots.push(map[item.id]);
    });
    return roots;
  }, []);

  // 🔹 Fetch all comments
  const fetchComments = useCallback(async () => {
    if (!tmdb_id) return;
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      setComments(buildTree(data));
    } catch (err) {
      console.error("❌ fetchComments error:", err);
    }
  }, [tmdb_id, buildTree]);

  // 🔹 Post a new comment or reply
  const postComment = async (content, parent_id = null) => {
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        credentials: "include", // ✅ must include cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tmdb_id, content, parent_id }),
      });
      if (!res.ok) throw new Error("Failed to post comment");
      await fetchComments();
    } catch (err) {
      console.error("❌ postComment error:", err);
    }
  };

  // 🔹 Edit a comment
  const editComment = async (id, content) => {
    try {
      const res = await fetch("/api/comments", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, content }),
      });
      if (!res.ok) throw new Error("Failed to edit comment");
      await fetchComments();
    } catch (err) {
      console.error("❌ editComment error:", err);
    }
  };

  // 🔹 Delete a comment
  const deleteComment = async (id) => {
    try {
      const res = await fetch(`/api/comments?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete comment");
      await fetchComments();
    } catch (err) {
      console.error("❌ deleteComment error:", err);
    }
  };

  // 🔹 Like a comment
  const likeComment = async (id) => {
    try {
      const res = await fetch(`/api/comments/like?id=${id}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to like comment");
      const data = await res.json();

      setComments((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, like_count: data.like_count } : c
        )
      );
    } catch (err) {
      console.error("❌ likeComment error:", err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return { comments, fetchComments, postComment, editComment, deleteComment, likeComment };
}
