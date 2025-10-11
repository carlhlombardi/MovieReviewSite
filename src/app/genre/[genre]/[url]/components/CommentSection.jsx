"use client";
import { useState, useEffect } from "react";
import Comment from "./Comment";
import CommentForm from "./CommentForm";

export default function CommentSection({ tmdb_id, username }) {
  const [comments, setComments] = useState([]);

  // Fetch comments
  const fetchComments = async () => {
    const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, { credentials: "include" });
    const data = await res.json();
    setComments(data || []);
  };

  useEffect(() => {
    fetchComments();
  }, [tmdb_id]);

  // Post new comment
  const postComment = async (content, parent_id = null) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id, content, parent_id }),
    });
    const data = await res.json();
    if (!parent_id) setComments([data, ...comments]);
    else fetchComments(); // simple approach for replies
  };

  const handleLike = async (id) => {
    const res = await fetch(`/api/comments/like?id=${id}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await res.json();
    fetchComments();
  };

  const handleDelete = async (id) => {
    await fetch(`/api/comments?id=${id}`, { method: "DELETE", credentials: "include" });
    fetchComments();
  };

  const handleEdit = async (id) => {
    const newContent = prompt("Edit your comment:");
    if (!newContent) return;
    await fetch("/api/comments", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, content: newContent }),
    });
    fetchComments();
  };

  const handleReply = async (parent_id) => {
    const reply = prompt("Write your reply:");
    if (!reply) return;
    await postComment(reply, parent_id);
  };

  return (
    <div>
      <CommentForm username={username} onSubmit={postComment} />

      {comments.map((c) => (
        <Comment
          key={c.id}
          comment={c}
          username={username}
          onLike={handleLike}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onReply={handleReply}
        />
      ))}
    </div>
  );
}
