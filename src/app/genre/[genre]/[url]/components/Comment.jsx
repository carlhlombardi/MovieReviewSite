"use client";
import Image from "next/image";
import { useState } from "react";
import { Button, Form, InputGroup } from "react-bootstrap";

export default function Comment({ comment, username, postComment, editComment, deleteComment, replies = [] }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(true);

  const isOwner = comment.username === username;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await postComment(replyText, comment.id);
    setReplyText("");
    setShowReplyInput(false);
    setShowReplies(true);
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    await editComment(comment.id, editText);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    await deleteComment(comment.id);
  };

  // Filter replies that belong to this comment
  const childReplies = replies.filter(r => r.parent_id === comment.id);

  return (
    <div className={`mb-3 ${comment.isReply ? "ms-4" : ""}`}>
      <div className="d-flex align-items-start">
        <Image
          src={comment.avatar_url}
          alt={comment.username}
          className="rounded-circle me-2"
          width={36} height={36}
        />
        <div className="flex-grow-1">
          <strong>{comment.username}</strong>

          {!editing ? (
            <p>{comment.content}</p>
          ) : (
            <InputGroup className="mb-2">
              <Form.Control value={editText} onChange={e => setEditText(e.target.value)} />
              <Button variant="success" size="sm" onClick={handleEdit}>Save</Button>
              <Button variant="secondary" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            </InputGroup>
          )}

          <div className="d-flex gap-2 mb-2">
            {!editing && (
              <>
                <Button
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setShowReplyInput(prev => !prev)}
                >
                  Reply
                </Button>

                {isOwner && (
                  <>
                    <Button variant="outline-secondary" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                    <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
                  </>
                )}
              </>
            )}
            {childReplies.length > 0 && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowReplies(prev => !prev)}
              >
                {showReplies ? "Hide Replies" : `Show ${childReplies.length} Replies`}
              </Button>
            )}
          </div>

          {showReplyInput && (
            <InputGroup className="mt-2">
              <Form.Control
                placeholder="Write a reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <Button variant="primary" size="sm" onClick={handleReply}>Post</Button>
            </InputGroup>
          )}

          {showReplies && childReplies.map(r => (
            <Comment
              key={r.id}
              comment={r}
              username={username}
              postComment={postComment}
              editComment={editComment}
              deleteComment={deleteComment}
              replies={replies} // pass all replies so nested replies are handled flat
            />
          ))}
        </div>
      </div>
    </div>
  );
}
