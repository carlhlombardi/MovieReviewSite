"use client";
import { useState } from "react";
import { Button, Card, Stack, Form } from "react-bootstrap";

export default function CommentItem({
  comment,
  username,
  onLike,
  onEdit,
  onDelete,
  onReply,
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.content);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await onReply(comment.id, replyText);
    setReplyText("");
    setIsReplying(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    await onEdit(comment, editText);
    setIsEditing(false);
  };

  return (
    <Card className="mb-2 ms-3 border shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <Card.Title className="fs-6 mb-1">{comment.username}</Card.Title>
            <Card.Subtitle className="text-muted small">
              {new Date(comment.created_at).toLocaleString()}
            </Card.Subtitle>
          </div>
        </div>

        {isEditing ? (
          <Form onSubmit={handleEditSubmit} className="mt-2">
            <Form.Control
              as="textarea"
              rows={2}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <Stack direction="horizontal" gap={2} className="mt-2">
              <Button type="submit" size="sm" variant="primary">
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
            </Stack>
          </Form>
        ) : (
          <Card.Text className="mt-2">{comment.content}</Card.Text>
        )}

        <Stack direction="horizontal" gap={2} className="mt-2">
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => onLike(comment.id)}
          >
            👍 {comment.like_count}
          </Button>

          {username && (
            <Button
              size="sm"
              variant="outline-success"
              onClick={() => setIsReplying(!isReplying)}
            >
              Reply
            </Button>
          )}

          {username === comment.username && (
            <>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                onClick={() => onDelete(comment.id)}
              >
                Delete
              </Button>
            </>
          )}
        </Stack>

        {isReplying && (
          <Form onSubmit={handleReplySubmit} className="mt-3">
            <Form.Control
              as="textarea"
              rows={2}
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <Stack direction="horizontal" gap={2} className="mt-2">
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
            </Stack>
          </Form>
        )}

        {comment.replies?.length > 0 && (
          <div className="ms-4 mt-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                username={username}
                onLike={onLike}
                onEdit={onEdit}
                onDelete={onDelete}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
