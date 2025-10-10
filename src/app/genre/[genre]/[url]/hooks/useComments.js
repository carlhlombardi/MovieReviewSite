"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id, username) {
  const [comments, setComments] = useState([]);

  // 🔹 Build nested tree structure
  const buildTree = useCallback((list) => {
    const map = {};
    const roots = [];

    list.forEach((item) => (map[item.id] = { ...item, replies: [] }));
    list.forEach((item) => {
      if (item.parent_id) {
        map[item.parent_id]?.replies.push(map[item.id]);
      } else {
        roots.push(map[item.id]);
      }
    });
    return roots;
  }, []);

  // 🔹 Fetch all comments
  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`);
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
      await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-username": username,
        },
        body: JSON.stringify({ tmdb_id, content, parent_id }),
      });
      fetchComments();
    } catch (err) {
      console.error("❌ postComment error:", err);
    }
  };

  // 🔹 Edit a comment
  const editComment = async (id, content) => {
    try {
      await fetch("/api/comments", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-username": username,
        },
        body: JSON.stringify({ id, content }),
      });
      fetchComments();
    } catch (err) {
      console.error("❌ editComment error:", err);
    }
  };

  // 🔹 Delete a comment
  const deleteComment = async (id) => {
    try {
      await fetch(`/api/comments?id=${id}`, {
        method: "DELETE",
        headers: {
          "x-username": username,
        },
      });
      fetchComments();
    } catch (err) {
      console.error("❌ deleteComment error:", err);
    }
  };

  // 🔹 Like / unlike a comment (updates tree)
const likeComment = async (id) => {
  try {
    const res = await fetch(`/api/comments/like?id=${id}`, {
      method: "POST",
      headers: {
        "x-username": username,
      },
    });

    if (!res.ok) {
      console.error("❌ likeComment failed:", await res.text());
      throw new Error("Failed to toggle like");
    }

    const data = await res.json();
    setComments((prev) =>
      prev.map((c) => (c.id === id ? { ...c, like_count: data.like_count } : c))
    );
  } catch (err) {
    console.error("❌ likeComment error:", err);
  }
};


  useEffect(() => {
    if (tmdb_id) fetchComments();
  }, [tmdb_id, fetchComments]);

  return { comments, postComment, editComment, deleteComment, likeComment };
}
