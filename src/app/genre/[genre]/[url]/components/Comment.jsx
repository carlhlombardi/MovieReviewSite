"use client";
import { useState } from "react";
import Image from "next/image";
import ReplyList from "./ReplyList";
import useComments from "../hooks/useComments";

export default function Comment({ comment, username }) {
  const { postComment, editComment, deleteComment } = useComments(comment.tmdb_id);
  const [replyText, setReplyText] = useState("");
  const [showReply, setShowReply] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    try {
      await postComment(replyText, comment.id);
      setReplyText("");
      setShowReply(false);
    } catch (err) { console.error(err); }
  };

  const handleEdit = async () => {
    if (!editText.trim()) return;
    try {
      await editComment(comment.id, editText);
      setIsEditing(false);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async () => {
    try { await deleteComment(comment.id); } catch (err) { console.error(err); }
  };

  return (
    <div className="mb-3 ps-0">
      <div className="d-flex align-items-start">
        <Image
          src={comment.avatar_url || "/default-avatar.png"}
          alt={comment.username}
          className="rounded-circle me-2"
          style={{ width: 40, height: 40 }}
        />
        <div className="flex-grow-1">
          <strong>{comment.username}</strong>
          {isEditing ? (
            <div>
              <textarea className="form-control" value={editText} onChange={e => setEditText(e.target.value)} />
              <button className="btn btn-sm btn-primary mt-1 me-1" onClick={handleEdit}>Save</button>
              <button className="btn btn-sm btn-secondary mt-1" onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          ) : (
            <p>{comment.content}</p>
          )}
          <div>
            <button className="btn btn-link btn-sm" onClick={() => setShowReply(!showReply)}>Reply</button>
            {username === comment.username && (
              <>
                <button className="btn btn-link btn-sm" onClick={() => setIsEditing(true)}>Edit</button>
                <button className="btn btn-link btn-sm text-danger" onClick={handleDelete}>Delete</button>
              </>
            )}
          </div>

          {showReply && (
            <div className="ms-5 mt-2">
              <textarea className="form-control" value={replyText} onChange={e => setReplyText(e.target.value)} />
              <button className="btn btn-primary btn-sm mt-1" onClick={handleReply}>Reply</button>
            </div>
          )}

          {comment.replies && comment.replies.length > 0 && (
            <div className="ms-5 mt-2">
              <ReplyList replies={comment.replies} username={username} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
