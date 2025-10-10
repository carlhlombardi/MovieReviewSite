"use client";
import { Card, Stack, Button } from "react-bootstrap";

export default function CommentItem({
  comment,
  username,
  onLike,
  onEdit,
  onDelete,
  onReply,
}) {
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

        <Card.Text className="mt-2">{comment.content}</Card.Text>

        <Stack direction="horizontal" gap={2}>
          <Button
            size="sm"
            variant="outline-primary"
            onClick={() => onLike(comment.id, 1)}
          >
            👍 {comment.like_count}
          </Button>

          {username === comment.username && (
            <>
              <Button
                size="sm"
                variant="outline-secondary"
                onClick={() => onEdit(comment)}
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

          {username && (
            <Button
              size="sm"
              variant="outline-success"
              onClick={() => onReply(comment.id)}
            >
              Reply
            </Button>
          )}
        </Stack>

        {comment.replies?.length > 0 && (
          <div className="ms-4 mt-3">
            {comment.replies.map((r) => (
              <CommentItem
                key={r.id}
                comment={r}
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
