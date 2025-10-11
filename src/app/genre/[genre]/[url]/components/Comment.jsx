"use client";
import { useState } from "react";
import { Card, Button, Form, Image } from "react-bootstrap";
import ReplyList from "./ReplyList";

export default function Comment({
  comment,
  username,
  onLike,
  onReply,
  onEdit,
  onDelete,
}) {
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editText, setEditText] = useState(comment.content);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await onReply(replyText.trim(), comment.id);
    setReplyText("");
    setIsReplying(false);
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    await onEdit(comment.id, editText.trim());
    setIsEditing(false);
  };

  return (
    <Card className="mb-2 shadow-sm rounded-3">
      <Card.Body className="d-flex gap-2">
        <Image
          src={comment.url_avatar || "/default-avatar.png"}
          roundedCircle
          width={40}
          height={40}
          alt={comment.username}
        />
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start">
            <strong>{comment.username}</strong>
            <small className="text-muted">
              {new Date(comment.created_at).toLocaleString()}
            </small>
          </div>

          {isEditing ? (
            <Form.Control
              as="textarea"
              rows={2}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="my-2"
            />
          ) : (
            <p className="my-2">{comment.content}</p>
          )}

          <div className="d-flex gap-2">
            <Button size="sm" variant={comment.likedByUser ? "primary" : "outline-primary"} onClick={() => onLike(comment.id)}>
              👍 {comment.like_count || 0}
            </Button>

            <Button size="sm" variant="link" onClick={() => setIsReplying(!isReplying)}>Reply</Button>

            {username === comment.username && (
              <>
                <Button size="sm" variant="outline-success" onClick={() => setIsEditing(!isEditing)}>Edit</Button>
                <Button size="sm" variant="outline-danger" onClick={() => onDelete(comment.id)}>Delete</Button>
              </>
            )}

            {isEditing && (
              <Button size="sm" variant="success" onClick={handleEdit}>Save</Button>
            )}
          </div>

          {isReplying && (
            <Form className="mt-2 d-flex gap-2">
              <Form.Control
                as="textarea"
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <Button size="sm" variant="primary" onClick={handleReply}>Reply</Button>
            </Form>
          )}

          {comment.replies?.length > 0 && (
            <ReplyList
              replies={comment.replies}
              username={username}
              onLike={onLike}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
