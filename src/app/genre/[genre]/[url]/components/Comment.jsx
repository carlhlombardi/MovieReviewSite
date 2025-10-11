"use client";
import { useState } from "react";
import Image from "next/image";

export default function Comment({ comment, username, postComment, editComment, deleteComment }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isOwner = comment.username === username;

  // Post a reply
  const handleReply = async () => {
    if (!replyText.trim()) return;
    await postComment(replyText, comment.id);
    setReplyText("");
    setShowReplies(true);
  };

  // Save edited comment
  const handleEdit = async () => {
    if (!editText.trim()) return;
    await editComment(comment.id, editText);
    setEditing(false);
  };

  // Delete comment
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    await deleteComment(comment.id);
  };

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
          <strong>{comment.username}</strong>
          {!editing ? (
            <p>{comment.content}</p>
          ) : (
            <div className="d-flex gap-2">
              <input
                type="text"
                className="form-control form-control-sm"
                value={editText}
                onChange={e => setEditText(e.target.value)}
              />
              <button className="btn btn-sm btn-success" onClick={handleEdit}>
                Save
              </button>
              <button className="btn btn-sm btn-secondary" onClick={() => setEditing(false)}>
                Cancel
              </button>
            </div>
          )}

          <div className="d-flex gap-2">
            {comment.replies.length > 0 && (
              <button
                className="btn btn-sm btn-link p-0"
                onClick={() => setShowReplies(prev => !prev)}
              >
                {comment.replies.length} {comment.replies.length === 1 ? "Reply" : "Replies"}
              </button>
            )}
            {isOwner && !editing && (
              <>
                <button
                  className="btn btn-sm btn-link p-0"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-link p-0 text-danger"
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showReplies && (
        <div className="ms-5 mt-2">
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

          <div className="d-flex mt-2">
            <input
              type="text"
              className="form-control form-control-sm me-2"
              placeholder="Reply..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" onClick={handleReply}>
              Reply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
