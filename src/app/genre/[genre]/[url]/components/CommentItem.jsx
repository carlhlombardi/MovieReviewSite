"use client";

import { useState } from "react";
import { Card, Button, Form } from "react-bootstrap";

export default function CommentItem({
  comment,
  username,
  onLike,
  onEdit,
  onDelete,
  onReply,
  level = 0,
  maxLevel = 4,
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

  // Visual nesting indicator without shrinking
  const borderColor = ["#dee2e6", "#ced4da", "#adb5bd", "#868e96", "#495057"][level] || "#495057";

  return (
    <div style={{ position: "relative", marginBottom: "1rem" }}>
      <Card
        className="shadow-sm"
        style={{
          borderLeft: `4px solid ${borderColor}`,
          maxWidth: "100%", // ensures card width stays full
          wordBreak: "break-word",
        }}
      >
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <strong>{comment.username}</strong>
            <small className="text-muted">{new Date(comment.created_at).toLocaleString()}</small>
          </div>

          {isEditing ? (
            <Form onSubmit={handleEditSubmit} className="mt-2">
              <Form.Control
                as="textarea"
                rows={2}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="mb-2"
              />
              <div className="d-flex gap-2">
                <Button type="submit" size="sm" variant="success">
                  Save
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          ) : (
            <Card.Text className="mt-2">{comment.content}</Card.Text>
          )}

          {/* Actions */}
          <div className="d-flex flex-wrap gap-2 small mt-2">
            <Button
              variant={comment.likedByUser ? "primary" : "outline-primary"}
              size="sm"
              onClick={onLike}
              disabled={!username}
            >
              👍 {comment.like_count || 0}
            </Button>

            {username && (
              <>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => setIsReplying((v) => !v)}
                >
                  Reply
                </Button>

                {username === comment.username && (
                  <>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => setIsEditing((v) => !v)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={onDelete}
                    >
                      Delete
                    </Button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Reply form */}
          {isReplying && (
            <Form onSubmit={handleReplySubmit} className="mt-2">
              <Form.Control
                as="textarea"
                rows={2}
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="mb-2"
              />
              <div className="d-flex gap-2">
                <Button type="submit" size="sm" variant="primary">
                  Reply
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsReplying(false)}
                >
                  Cancel
                </Button>
              </div>
            </Form>
          )}

          {/* Nested replies */}
          {comment.replies?.length > 0 &&
            comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                username={username}
                onLike={(id) => onLike(id)}
                onEdit={(id, content) => onEdit(id, content)}
                onDelete={(id) => onDelete(id)}
                onReply={(text, parentId) => onReply(text, parentId)}
                level={level + 1}
                maxLevel={maxLevel}
              />
            ))}
        </Card.Body>
      </Card>
    </div>
  );
}
