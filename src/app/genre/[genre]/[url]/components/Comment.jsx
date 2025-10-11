"use client";
import { useState } from "react";
import { Card, Button } from "react-bootstrap";
import Image from "next/image";
import ReplyList from "./ReplyList";
import CommentForm from "./CommentForm";

export default function Comment({ comment, username, onLike, onEdit, onDelete, onReply }) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const handleReplySubmit = async (text) => {
    await onReply(text, comment.id);
    setShowReplyForm(false);
    setShowReplies(true);
  };

  return (
    <Card className="mb-2">
      <Card.Body className="d-flex gap-2">
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

          <div className="d-flex gap-2 small">
            <Button size="sm" variant={comment.likedByUser ? "primary" : "outline-primary"} onClick={() => onLike(comment.id)}>
              👍 {comment.like_count || 0}
            </Button>

            <Button size="sm" variant="link" onClick={() => setShowReplyForm((v) => !v)}>Reply</Button>

            {username === comment.username && (
              <>
                <Button size="sm" variant="link" onClick={() => onEdit(comment.id)}>Edit</Button>
                <Button size="sm" variant="link" onClick={() => onDelete(comment.id)}>Delete</Button>
              </>
            )}
          </div>

          {showReplyForm && <CommentForm username={username} onSubmit={handleReplySubmit} placeholder="Write a reply..." />}

          {comment.replies?.length > 0 && (
            <div className="ms-5">
              {!showReplies && (
                <Button size="sm" variant="link" onClick={() => setShowReplies(true)}>
                  See {comment.replies.length} {comment.replies.length === 1 ? "reply" : "replies"}
                </Button>
              )}
              {showReplies && (
                <ReplyList
                  replies={comment.replies}
                  username={username}
                  onLike={onLike}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onReply={onReply}
                />
              )}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
