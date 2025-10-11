"use client";
import { useState } from "react";
import { Button, Image } from "react-bootstrap";
import Link from "next/link";
import CommentForm from "./CommentForm";
import ReplyList from "./ReplyList";

export default function Comment({
  comment,
  username,
  onLike,
  onReply,
  onEdit,
  onDelete,
}) {
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="mb-3">
      <div className="d-flex">
        <Link href={`/user/${comment.username}`}>
          <Image
            src={comment.url_avatar || "/default-avatar.png"}
            alt="avatar"
            roundedCircle
            width={40}
            height={40}
            className="me-2 flex-shrink-0"
          />
        </Link>
        <div className="flex-grow-1">
          <strong>{comment.username}</strong>
          <p>{comment.content}</p>
          <div className="d-flex gap-2 mb-1">
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => onLike(comment.id)}
            >
              👍 {comment.like_count}
            </Button>
            <Button variant="link" size="sm" onClick={() => setReplying(!replying)}>
              Reply
            </Button>
            {username === comment.username && (
              <>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    const updated = prompt("Edit comment", comment.content);
                    if (updated?.trim()) onEdit(comment.id, updated);
                  }}
                >
                  Edit
                </Button>
                <Button variant="link" size="sm" onClick={() => onDelete(comment.id)}>
                  Delete
                </Button>
              </>
            )}
          </div>

          {replying && (
            <CommentForm
              onSubmit={(text) => {
                onReply(text, comment.id);
                setReplying(false);
                setShowReplies(true);
              }}
              placeholder="Write a reply..."
            />
          )}

          {comment.replies.length > 0 && (
            <Button
              variant="link"
              size="sm"
              className="ps-0"
              onClick={() => setShowReplies(!showReplies)}
            >
              {showReplies ? "Hide replies" : `View ${comment.replies.length} replies`}
            </Button>
          )}

          {showReplies && (
            <div className="ms-5 mt-2 border-start ps-3">
              <ReplyList
                replies={comment.replies}
                username={username}
                onLike={onLike}
                onReply={onReply}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
