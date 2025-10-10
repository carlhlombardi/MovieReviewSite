// src/app/genre/[genre]/[url]/components/CommentForm.jsx
"use client";
import { useState } from "react";

export default function CommentForm({ onSubmit }) {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      await onSubmit(text.trim());
      setText(""); // clear form
    } catch (err) {
      alert(err.message || "Failed to post comment");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-3">
      <textarea
        className="form-control mb-2"
        placeholder="Write a comment..."
        rows="3"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="submit" className="btn btn-primary">
        Post Comment
      </button>
    </form>
  );
}
