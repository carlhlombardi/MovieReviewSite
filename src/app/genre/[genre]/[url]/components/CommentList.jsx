"use client";
import { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";

export default function CommentList({ comments, username, onPost, onEdit, onDelete, onLike }) {
  const [newComment, setNewComment] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await onPost(newComment.trim());
    setNewComment("");
  };

  return (
    <div>
      <Form onSubmit={handleSubmit} className="mb-3">
        <Form.Control
          as="textarea"
          rows={2}
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2 rounded-3 shadow-sm"
        />
        <Button type="submit" size="sm" variant="primary">Post Comment</Button>
      </Form>

      {comments.map((c) => (
        <Card key={c.id} className="mb-2 shadow-sm rounded-3">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center">
              <strong>{c.username}</strong>
              <small className="text-muted">{new Date(c.created_at).toLocaleString()}</small>
            </div>
            <Card.Text className="mt-2">{c.content}{c.parent_id && <small className="text-muted"> ↳ Reply to comment {c.parent_id}</small>}</Card.Text>

            <div className="d-flex gap-2 flex-wrap">
              <Button size="sm" variant={c.likedByUser ? "primary" : "outline-primary"} onClick={() => onLike(c.id)}>
                👍 {c.like_count || 0}
              </Button>

              {username && username === c.username && (
                <>
                  <Button size="sm" variant="outline-success" onClick={() => {
                    const updated = prompt("Edit comment:", c.content);
                    if (updated?.trim()) onEdit(c.id, updated.trim());
                  }}>Edit</Button>
                  <Button size="sm" variant="outline-danger" onClick={() => onDelete(c.id)}>Delete</Button>
                </>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}
