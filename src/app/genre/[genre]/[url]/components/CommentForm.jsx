"use client";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";

export default function CommentForm({ onSubmit }) {
  const [text, setText] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await onSubmit(text);
    setText("");
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
