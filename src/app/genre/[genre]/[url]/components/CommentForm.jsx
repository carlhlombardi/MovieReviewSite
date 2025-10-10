"use client";
import { useState } from "react";
import { Form, Button, Card } from "react-bootstrap";

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
    <Card className="mb-4 shadow-sm border-0">
      <Card.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="commentTextarea" className="mb-3">
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="💬 Write a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="rounded-3 shadow-sm"
            />
          </Form.Group>
          <div className="d-flex justify-content-end">
            <Button
              variant="primary"
              type="submit"
              className="px-4 rounded-pill"
            >
              Post Comment
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
}
