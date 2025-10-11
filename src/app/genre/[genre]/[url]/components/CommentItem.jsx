"use client";
import { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";

export default function CommentItem({
  comment,
  username,
  onLike = () => {},
  onEdit = () => {},
  onDelete = () => {},
  onReply = () => {},
  level = 0,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [replyText, setReplyText] = useState("");

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (editText?.trim()) {
      onEdit(comment.id, editText.trim());
      setIsEditing(false);
    }
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (replyText?.trim()) {
      onReply(replyText.trim(), comment.id);
      setReplyText("");
      setIsReplying(false);
    }
  };

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <Card className="mb-3 border-0 shadow-sm bg-light rounded-3">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <strong>{comment.username}</strong>
            <small className="text-muted">{new Date(comment.created_at).toLocaleString()}</small>
          </div>

          {isEditing ? (
            <Form onSubmit={handleEditSubmit} className="mt-3">
              <Form.Control
                as="textarea"
                rows={2}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="mb-2 rounded-3 shadow-sm"
              />
              <div className="d-flex gap-2">
                <Button type="submit" size="sm" variant="success">Save</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </Form>
          ) : (
            <Card.Text className="mt-3 mb-2">{comment.content}</Card.Text>
          )}

          <div className="d-flex flex-wrap gap-3 small mt-2">
            <Button variant={comment.likedByUser ? "primary" : "outline-primary"} size="sm" onClick={onLike} disabled={!username}>
              👍 {comment.like_count || 0}
            </Button>

            {username && (
              <>
                <Button variant="outline-secondary" size="sm" onClick={() => setIsReplying((v) => !v)}>Reply</Button>
                {username === comment.username && (
                  <>
                    <Button variant="outline-success" size="sm" onClick={() => setIsEditing((v) => !v)}>Edit</Button>
                    <Button variant="outline-danger" size="sm" onClick={onDelete}>Delete</Button>
                  </>
                )}
              </>
            )}
          </div>

          {isReplying && (
            <Form onSubmit={handleReplySubmit} className="mt-3 ms-3">
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="mb-2 rounded-3 shadow-sm"
              />
              <div className="d-flex gap-2">
                <Button type="submit" size="sm" variant="primary">Reply</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setIsReplying(false)}>Cancel</Button>
              </div>
            </Form>
          )}

          {comment.replies?.length > 0 && comment.replies.map((r) => (
            <CommentItem
              key={r.id}
              comment={r}
              username={username}
              onLike={() => onLike(r.id)}
              onEdit={onEdit}
              onDelete={() => onDelete(r.id)}
              onReply={onReply}
              level={level + 1}
            />
          ))}
        </Card.Body>
      </Card>
    </div>
  );
}
