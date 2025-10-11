"use client";
import Image from "next/image";
import { useState } from "react";
import { Button, Form } from "react-bootstrap";

export default function Comment({ comment, username, postComment, editComment, deleteComment }) {
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isOwner = comment.username === username;
  const replies = comment.replies || [];

  // Post a reply
  const handleReply = async () => {
    if (!replyText.trim()) return;
    await postComment(replyText, comment.id);
    setReplyText("");
    setShowReplyInput(false);
    setShowAllReplies(true);
  };

  // Save edited comment
  const handleEdit = async () => {
    if (!editText.trim()) return;
    await editComment(comment.id, editText);
    setEditing(false);
  };

  // Delete comment
  const handleDelete = async () => {
    await deleteComment(comment.id);
  };

  const visibleReplies = showAllReplies ? replies : replies.slice(0, 1);
  const hiddenReplyCount = replies.length - visibleReplies.length;

  return (
    <div className="mb-2">
      <div className="d-flex align-items-start">
        <Image
          src={comment.avatar_url}
          alt={comment.username}
          className="rounded-circle me-2"
          width={36}
          height={36}
        />
        <div className="flex-grow-1">
          <div className="d-flex align-items-center justify-content-between">
            <strong>{comment.username}</strong>
            {isOwner && !editing && (
              <div className="d-flex gap-2">
                <Button size="sm" variant="link" onClick={() => setEditing(true)}>Edit</Button>
                <Button size="sm" variant="link" className="text-danger" onClick={handleDelete}>Delete</Button>
              </div>
            )}
          </div>

          {!editing ? (
            <p className="mb-1">{comment.content}</p>
          ) : (
            <div className="d-flex gap-2 mb-1">
              <Form.Control
                type="text"
                size="sm"
                value={editText}
                onChange={e => setEditText(e.target.value)}
              />
              <Button size="sm" variant="success" onClick={handleEdit}>Save</Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
            </div>
          )}

          <div className="d-flex gap-2 mb-1">
            <Button size="sm" variant="link" onClick={() => setShowReplyInput(prev => !prev)}>Reply</Button>
            {hiddenReplyCount > 0 && !showAllReplies && (
              <Button
                size="sm"
                variant="link"
                onClick={() => setShowAllReplies(true)}
              >
                View {hiddenReplyCount} more {hiddenReplyCount === 1 ? "reply" : "replies"}
              </Button>
            )}
          </div>

          {showReplyInput && (
            <div className="d-flex gap-2 mb-2">
              <Form.Control
                type="text"
                size="sm"
                placeholder="Write a reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <Button size="sm" variant="primary" onClick={handleReply}>Reply</Button>
            </div>
          )}

          {/* Nested replies */}
          <div className="ms-4">
            {visibleReplies.map(r => (
              <Comment
                key={r.id}
                comment={r}
                username={username}
                postComment={postComment}
                editComment={editComment}
                deleteComment={deleteComment}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
