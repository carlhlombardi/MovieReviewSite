"use client";
import { useState } from "react";
import { Button, Form, Image } from "react-bootstrap";

export default function Comment({ comment, username, postComment, editComment, deleteComment }) {
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [showReplies, setShowReplies] = useState(false);

  const isOwner = comment.username === username;

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
        {comment.avatar_url && (
          <Image src={comment.avatar_url} alt="Alt" roundedCircle width={36} height={36} className="me-2" />
        )}
        <div className="flex-grow-1">
          <strong>{comment.username}</strong>
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
            {comment.replies.length > 0 && (
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowReplies(prev => !prev)}
              >
                {comment.replies.length} {comment.replies.length === 1 ? "Reply" : "Replies"}
              </Button>
            )}

            <Button variant="link" size="sm" onClick={() => setShowReplyInput(prev => !prev)}>
              Reply
            </Button>

            {isOwner && (
              <>
                <Button variant="link" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                <Button variant="link" size="sm" className="text-danger" onClick={handleDelete}>Delete</Button>
              </>
            )}
          </div>

          {showReplyInput && (
            <div className="d-flex gap-2 mb-2">
              <Form.Control
                type="text"
                size="sm"
                placeholder="Reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
              />
              <Button size="sm" variant="primary" onClick={handleReply}>Reply</Button>
            </div>
          )}

          {showReplies && comment.replies.length > 0 && (
            <div className="ms-0">
              {comment.replies.map(r => (
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
