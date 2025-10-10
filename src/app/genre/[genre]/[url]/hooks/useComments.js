"use client";
import { useState, useEffect, useCallback } from "react";

export default function useComments(tmdb_id, username) {
  const [comments, setComments] = useState([]);

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`);
    const data = await res.json();
    setComments(buildTree(data));
  }, [tmdb_id]);

  const buildTree = (list) => {
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
  };

  const postComment = async (content, parent_id = null) => {
    await fetch("/api/comments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-username": username,
      },
      body: JSON.stringify({ tmdb_id, content, parent_id }),
    });
    fetchComments();
  };

  const editComment = async (id, content) => {
    await fetch("/api/comments", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-username": username,
      },
      body: JSON.stringify({ id, content }),
    });
    fetchComments();
  };

  const deleteComment = async (id) => {
    await fetch(`/api/comments?id=${id}`, {
      method: "DELETE",
      headers: {
        "x-username": username,
      },
    });
    fetchComments();
  };

  const likeComment = async (id, delta) => {
  const res = await fetch(`/api/comments/like?id=${id}&delta=${delta}`, {
    method: "POST",
  });

  if (!res.ok) return;

  const data = await res.json();
  setComments((prev) =>
    prev.map((c) =>
      c.id === id ? { ...c, like_count: data.like_count } : c
    )
  );
};


  useEffect(() => {
    if (tmdb_id) fetchComments();
  }, [tmdb_id, fetchComments]);

  return { comments, postComment, editComment, deleteComment, likeComment };
}
