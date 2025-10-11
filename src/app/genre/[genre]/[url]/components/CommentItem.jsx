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
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [replyText, setReplyText] = useState("");

  const handleEditSubmit = (e) => {
    e.preventDefault();
    onEdit(comment.id, editText);
    setIsEditing(false);
  };

  const handleEdit = (id, content) => {
  if (content?.trim()) editComment(id, content.trim());
};

  const handleReplySubmit = (e) => {
    e.preventDefault();
    onReply(replyText, comment.id);
    setReplyText("");
    setIsReplying(false);
  };

  return (
    <Card className="mb-3 border-0 shadow-sm bg-light rounded-3">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center">
          <strong>{comment.username}</strong>
          <small className="text-muted">
            {new Date(comment.created_at).toLocaleString()}
          </small>
        </div>

        {/* Comment content */}
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
          <Card.Text className="mt-3 mb-2">{comment.content}</Card.Text>
        )}

        {/* Comment actions */}
        <div className="d-flex flex-wrap gap-3 small mt-2">
          <Button
            variant={comment.likedByUser ? "primary" : "outline-primary"}
            size="sm"
            className={`px-2 py-0 d-flex align-items-center gap-1 rounded-pill ${
              comment.likedByUser ? "text-white bg-primary border-primary" : ""
            }`}
            onClick={onLike}
            disabled={!username}
          >
            <span
              className={`fw-bold ${
                comment.likedByUser ? "text-white" : "text-primary"
              }`}
            >
              👍
            </span>
            <span>{comment.like_count || 0}</span>
          </Button>

          {username && (
            <>
              <Button
                variant="outline-secondary"
                size="sm"
                className="px-2 py-0 rounded-pill"
                onClick={() => setIsReplying((v) => !v)}
              >
                Reply
              </Button>

              {username === comment.username && (
                <>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="px-2 py-0 rounded-pill"
                    onClick={() => setIsEditing((v) => !v)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    className="px-2 py-0 rounded-pill"
                    onClick={onDelete}
                  >
                    Delete
                  </Button>
                </>
              )}
            </>
          )}
        </div>

        {/* Inline reply form */}
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
        {comment.replies?.length > 0 && (
          <div className="mt-3 ms-4 border-start ps-3">
            {comment.replies.map((reply) => (
            <CommentItem
  key={comment.id}
  comment={comment}
  username={username}
  onLike={() => likeComment(comment.id)}
  onEdit={handleEdit}
  onDelete={() => deleteComment(comment.id)}
  onReply={handleReply}
/>

            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
