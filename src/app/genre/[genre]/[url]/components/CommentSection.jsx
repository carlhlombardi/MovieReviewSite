"use client";
import { useState, useEffect } from "react";
import Comment from "./Comment";
import CommentForm from "./CommentForm";

export default function CommentSection({ tmdb_id, username }) {
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    const res = await fetch(`/api/comments?tmdb_id=${tmdb_id}`, { credentials: "include" });
    const data = await res.json();
    setComments(data || []);
  };

  useEffect(() => { fetchComments(); }, [tmdb_id]);

  const postComment = async (content, parent_id = null) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tmdb_id, content, parent_id }),
    });
    const data = await res.json();
    fetchComments();
  };

  const handleLike = async (id) => { await fetch(`/api/comments/like?id=${id}`, { method: "POST", credentials: "include" }); fetchComments(); };
  const handleDelete = async (id) => { await fetch(`/api/comments?id=${id}`, { method: "DELETE", credentials: "include" }); fetchComments(); };
  const handleEdit = async (id) => { const content = prompt("Edit your comment:"); if (content) { await fetch("/api/comments", { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, content }) }); fetchComments(); }; };
  const handleReply = async (text, parent_id) => { await postComment(text, parent_id); };

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
