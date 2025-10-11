"use client";
import { Card, Button } from "react-bootstrap";
import Image from "next/image";

export default function Comment({ comment, username, onLike, onReply, onEdit, onDelete }) {
  return (
    <Card className="mb-2">
      <Card.Body className="d-flex gap-2">
        {/* Avatar */}
        <Image
          src={comment.url_avatar || "/default-avatar.png"}
          alt={comment.username}
          width={40}
          height={40}
          className="rounded-circle"
        />

        <div className="flex-grow-1">
          <strong>{comment.username}</strong>
          <small className="text-muted ms-2">
            {new Date(comment.created_at).toLocaleString()}
          </small>
          <p>{comment.content}</p>

          {/* Action buttons */}
          {username && (
            <div className="d-flex gap-2 small">
              <Button size="sm" variant={comment.likedByUser ? "primary" : "outline-primary"} onClick={() => onLike(comment.id)}>
                👍 {comment.like_count || 0}
              </Button>

              <Button size="sm" variant="link" onClick={() => onReply(comment.id)}>
                Reply
              </Button>

              {username === comment.username && (
                <>
                  <Button size="sm" variant="link" onClick={() => onEdit(comment.id)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="link" onClick={() => onDelete(comment.id)}>
                    Delete
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
