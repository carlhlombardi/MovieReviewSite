"use client";
import { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";

export default function CommentItem({ comment, username, onLike, onEdit, onDelete, onReply, level = 0 }) {
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
      onReply(replyText.trim(), comment.id); // parent_id
      setReplyText("");
      setIsReplying(false);
    }
  };

  return (
    <div style={{ marginLeft: `${level * 20}px` }}>
      <Card className="mb-2 border-0 shadow-sm bg-light rounded-3">
        <Card.Body>
          <div className="d-flex justify-content-between">
            <strong>{comment.username}</strong>
            <small className="text-muted">{new Date(comment.created_at).toLocaleString()}</small>
          </div>

          {isEditing ? (
            <Form onSubmit={handleEditSubmit} className="mt-2">
              <Form.Control as="textarea" rows={2} value={editText} onChange={(e) => setEditText(e.target.value)} className="mb-2" />
              <div className="d-flex gap-2">
                <Button type="submit" size="sm" variant="success">Save</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setIsEditing(false)}>Cancel</Button>
              </div>
            </Form>
          ) : (
            <Card.Text className="mt-2 mb-2">{comment.content}</Card.Text>
          )}

          <div className="d-flex gap-2 small flex-wrap">
            <Button size="sm" variant={comment.likedByUser ? "primary" : "outline-primary"} onClick={onLike} disabled={!username}>
              👍 {comment.like_count || 0}
            </Button>

            {username && (
              <>
                <Button size="sm" variant="outline-secondary" onClick={() => setIsReplying(v => !v)}>Reply</Button>
                {username === comment.username && (
                  <>
                    <Button size="sm" variant="outline-success" onClick={() => setIsEditing(v => !v)}>Edit</Button>
                    <Button size="sm" variant="outline-danger" onClick={onDelete}>Delete</Button>
                  </>
                )}
              </>
            )}
          </div>

          {isReplying && (
            <Form onSubmit={handleReplySubmit} className="mt-2 ms-3">
              <Form.Control as="textarea" rows={2} placeholder="Write a reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} className="mb-2" />
              <div className="d-flex gap-2">
                <Button type="submit" size="sm" variant="primary">Reply</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setIsReplying(false)}>Cancel</Button>
              </div>
            </Form>
          )}

          {comment.replies?.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((r) => (
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
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
