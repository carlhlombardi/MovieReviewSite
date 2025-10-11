"use client";
import { useState } from "react";
import { Form, Button } from "react-bootstrap";

export default function CommentForm({ username, onSubmit, placeholder = "Add a comment..." }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim());
    setText("");
  };

  return (
    <Form onSubmit={handleSubmit} className="mb-2">
      <Form.Control
        as="textarea"
        rows={2}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mb-1"
      />
      <Button type="submit" disabled={!username || !text.trim()} size="sm">Post</Button>
    </Form>
  );
}
