"use client";
import { useState } from "react";

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

  const handleReplySubmit = (e) => {
    e.preventDefault();
    onReply(replyText, comment.id);
    setReplyText("");
    setIsReplying(false);
  };

  return (
    <div className="border rounded p-3 mb-3 bg-light">
      <div className="d-flex justify-content-between">
        <strong>{comment.username}</strong>
        <small className="text-muted">
          {new Date(comment.created_at).toLocaleString()}
        </small>
      </div>

      {/* Comment content */}
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="mt-2">
          <textarea
            className="form-control mb-2"
            rows="2"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-sm btn-success">
              Save
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-2 mb-2">{comment.content}</p>
      )}

      {/* Comment actions */}
      <div className="d-flex gap-3 small">
        <button
          className="btn btn-link btn-sm p-0"
          onClick={onLike}
          disabled={!username}
        >
          👍 {comment.likes || 0}
        </button>

        {username && (
          <>
            <button
              className="btn btn-link btn-sm p-0"
              onClick={() => setIsReplying((v) => !v)}
            >
              Reply
            </button>

            {username === comment.username && (
              <>
                <button
                  className="btn btn-link btn-sm p-0"
                  onClick={() => setIsEditing((v) => !v)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-link btn-sm text-danger p-0"
                  onClick={onDelete}
                >
                  Delete
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Inline reply form */}
      {isReplying && (
        <form onSubmit={handleReplySubmit} className="mt-2 ms-3">
          <textarea
            className="form-control mb-2"
            rows="2"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary">
              Reply
            </button>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setIsReplying(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-3 ms-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              username={username}
              onLike={() => onLike(reply.id)}
              onEdit={onEdit}
              onDelete={() => onDelete(reply.id)}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
