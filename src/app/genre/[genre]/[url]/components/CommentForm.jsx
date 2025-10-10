"use client";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";

export default function CommentForm({ tmdb_id, movie, onCommentPosted }) {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-username": localStorage.getItem("username"), // ✅ send auth headers
          "x-userid": localStorage.getItem("userId"),
        },
        body: JSON.stringify({
          tmdb_id,
          content: text,
          movie_title: movie?.title || null,
          source: "movie-page",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("❌ Comment failed:", data.error);
        alert(data.error || "Failed to post comment.");
      } else {
        console.log("✅ Comment posted:", data);
        setText("");
        onCommentPosted?.(data); // refresh comment list if needed
      }
    } catch (err) {
      console.error("❌ Comment submit error:", err);
    }
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-4">
      <Form.Group>
        <Form.Control
          as="textarea"
          rows={3}
          placeholder="Write a comment..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </Form.Group>
      <div className="mt-2 d-flex justify-content-end">
        <Button type="submit" variant="primary">
          Post
        </Button>
      </div>
    </Form>
  );
}
