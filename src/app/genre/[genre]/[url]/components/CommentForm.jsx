"use client";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";

export default function CommentForm({ tmdb_id, movie, onCommentPosted }) {
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      setIsPosting(true);
      const res = await fetch("/api/comments", {
        method: "POST",
        credentials: "include", // ✅ important for cookies
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tmdb_id,
          content: text.trim(),
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
        onCommentPosted?.(data);
      }
    } catch (err) {
      console.error("❌ Comment submit error:", err);
    } finally {
      setIsPosting(false);
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
          disabled={isPosting}
        />
      </Form.Group>
      <div className="mt-2 d-flex justify-content-end">
        <Button type="submit" variant="primary" disabled={isPosting}>
          {isPosting ? "Posting..." : "Post"}
        </Button>
      </div>
    </Form>
  );
}
