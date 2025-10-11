"use client";
import { useState } from "react";
import { Button, Form, Image } from "react-bootstrap";

export default function Comment({ comment, username, postComment, editComment, deleteComment }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showReplies, setShowReplies] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isOwner = comment.username === username;
  const replies = comment.replies || [];

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await postComment(replyText, comment.id);
    setReplyText("");
    setShowReplies(true);
    setShowReplyInput(false);
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

  return (
    <div className="mb-3">
      <div className="d-flex align-items-start">
        <Image
          src={comment.avatar_url}
          alt={`${comment.username}'s avatar`}
          roundedCircle
          width={36}
          height={36}
          className="me-2"
        />
        <div className="flex-grow-1">
          <strong>{comment.username}</strong>
          {!editing ? (
            <p>{comment.content}</p>
          ) : (
            <div className="d-flex gap-2">
              <Form.Control
                type="text"
                size="sm"
                value={editText}
                onChange={e => setEditText(e.target.value)}
              />
              <Button size="sm" variant="success" onClick={handleEdit}>
                Save
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </div>
          )}

          <div className="d-flex gap-2 flex-wrap">
            {isOwner && !editing && (
              <>
                <Button size="sm" variant="link" onClick={() => setEditing(true)}>
                  Edit
                </Button>
                <Button size="sm" variant="link" className="text-danger" onClick={handleDelete}>
                  Delete
                </Button>
              </>
            )}
            <Button size="sm" variant="link" onClick={() => setShowReplyInput(prev => !prev)}>
              Reply
            </Button>
            {replies.length > 0 && !showReplies && (
              <Button size="sm" variant="link" onClick={() => setShowReplies(true)}>
                View {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </Button>
            )}
          </div>

          {showReplyInput && (
            <div className="d-flex mt-2 gap-2">
              <Form.Control
                size="sm"
                type="text"
                placeholder="Reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
              />
              <Button size="sm" variant="primary" onClick={handleReply}>
                Reply
              </Button>
            </div>
          )}

          {showReplies && replies.length > 0 && (
            <div className="ms-4 mt-2">
              {replies.map(r => (
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
          )}
        </div>
      </div>
    </div>
  );
}
