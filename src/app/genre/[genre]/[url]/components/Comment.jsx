"use client";
import Image from "next/image";
import { useState } from "react";

export default function Comment({ comment, username, postComment, editComment, deleteComment }) {
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const isOwner = comment.username === username;
  const replies = comment.replies || [];

  const handleReply = async () => {
    if (!replyText.trim()) return;
    await postComment(replyText, comment.id);
    setReplyText("");
    setShowAllReplies(true);
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    await editComment(comment.id, editText);
    setEditing(false);
  };

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
            {replies.length > 1 && !showAllReplies && (
              <button
                className="btn btn-sm btn-link p-0"
                onClick={() => setShowAllReplies(true)}
              >
                View {hiddenReplyCount} more {hiddenReplyCount === 1 ? "reply" : "replies"}
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

      {/* Reply input always shows */}
      <div className="ms-5 mt-2">
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
    </div>
  );
}
