"use client";
import { useState } from "react";
import useComments from "../hooks/useComments";
import Comment from "./Comment";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, loading, error, postComment } = useComments(tmdb_id);
  const [newComment, setNewComment] = useState("");

  const handlePost = async () => {
    if (!newComment.trim()) return;
    try {
      await postComment(newComment);
      setNewComment("");
    } catch (err) { console.error(err); }
  };

  return (
    <div>
      <div className="mb-3">
        <textarea
          className="form-control"
          placeholder="Add a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
        />
        <button className="btn btn-primary mt-2" onClick={handlePost}>Comment</button>
      </div>

      {loading && <p>Loading comments...</p>}
      {error && <p className="text-danger">{error}</p>}

      {comments.map(c => (
        <Comment key={c.id} comment={c} username={username} />
      ))}
    </div>
  );
}
