"use client";
import { useState } from "react";
import { MessageCircle, ThumbsUp, Edit3, Trash2, CornerDownRight } from "lucide-react";

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
    <div
      className="p-3 mb-3 rounded-3 border bg-white shadow-sm"
      style={{ borderLeft: "4px solid #0d6efd" }}
    >
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center">
        <div className="fw-semibold text-primary">{comment.username}</div>
        <small className="text-muted">
          {new Date(comment.created_at).toLocaleString()}
        </small>
      </div>

      {/* Content */}
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="mt-2">
          <textarea
            className="form-control mb-2"
            rows="2"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            style={{ resize: "none" }}
          />
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-sm btn-success px-3">
              💾 Save
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary px-3"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-2 mb-2 fs-6">{comment.content}</p>
      )}

      {/* Actions */}
      <div className="d-flex align-items-center gap-3 small mt-1">
        <button
          className="btn btn-link btn-sm text-decoration-none text-muted p-0 d-flex align-items-center gap-1"
          onClick={onLike}
          disabled={!username}
        >
          <ThumbsUp size={16} /> {comment.like_count || 0}
        </button>

        {username && (
          <>
            <button
              className="btn btn-link btn-sm text-decoration-none text-muted p-0 d-flex align-items-center gap-1"
              onClick={() => setIsReplying((v) => !v)}
            >
              <MessageCircle size={16} /> Reply
            </button>

            {username === comment.username && (
              <>
                <button
                  className="btn btn-link btn-sm text-decoration-none text-muted p-0 d-flex align-items-center gap-1"
                  onClick={() => setIsEditing((v) => !v)}
                >
                  <Edit3 size={16} /> Edit
                </button>
                <button
                  className="btn btn-link btn-sm text-danger text-decoration-none p-0 d-flex align-items-center gap-1"
                  onClick={onDelete}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Inline reply form */}
      {isReplying && (
        <form onSubmit={handleReplySubmit} className="mt-3 ms-4">
          <textarea
            className="form-control mb-2"
            rows="2"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            style={{ resize: "none" }}
          />
          <div className="d-flex gap-2">
            <button type="submit" className="btn btn-sm btn-primary px-3">
              <CornerDownRight size={16} /> Reply
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary px-3"
              onClick={() => setIsReplying(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Nested replies */}
      {comment.replies?.length > 0 && (
        <div className="mt-3 ms-4 border-start ps-3">
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
