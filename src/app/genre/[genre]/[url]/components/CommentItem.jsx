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
  // ✅ Hooks must come first
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editText, setEditText] = useState(comment?.content ?? "");
  const [replyText, setReplyText] = useState("");

  // ✅ Return null AFTER hooks are declared
  if (!comment) return null;

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    onEdit(comment.id, editText.trim());
    setIsEditing(false);
  };

  const handleReplySubmit = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    onReply(replyText.trim(), comment.id);
    setReplyText("");
    setIsReplying(false);
  };

  return (
    <div className="border rounded p-3 mb-3 bg-light shadow-sm">
      <div className="d-flex justify-content-between align-items-center">
        <strong>{comment.username}</strong>
        <small className="text-muted">
          {new Date(comment.created_at).toLocaleString()}
        </small>
      </div>

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

      <div className="d-flex gap-3 small">
        <button
          className="btn btn-link btn-sm p-0"
          onClick={() => onLike(comment.id)}
          disabled={!username}
        >
          <ThumbsUp size={14} /> {comment.like_count || 0}
        </button>

        {username && (
          <>
            <button
              className="btn btn-link btn-sm p-0"
              onClick={() => setIsReplying((v) => !v)}
            >
              <CornerDownRight size={14} /> Reply
            </button>

            {username === comment.username && (
              <>
                <button
                  className="btn btn-link btn-sm p-0"
                  onClick={() => setIsEditing((v) => !v)}
                >
                  <Edit3 size={14} /> Edit
                </button>
                <button
                  className="btn btn-link btn-sm text-danger p-0"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
          </>
        )}
      </div>

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

      {comment.replies?.length > 0 && (
        <div className="mt-3 ms-4 border-start ps-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              username={username}
              onLike={onLike}
              onEdit={onEdit}
              onDelete={onDelete}
              onReply={onReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}
