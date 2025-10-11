"use client";
import { useState } from "react";
import CommentItem from "./CommentItem";
import useComments from "../hooks/useComments";
import { Form, Button } from "react-bootstrap";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, postComment, editComment, deleteComment, likeComment } = useComments(tmdb_id);
  const [newComment, setNewComment] = useState("");

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await postComment(newComment.trim());
    setNewComment("");
  };

  return (
    <div className="mt-4">
      <h4 className="mb-3">Comments</h4>

      {username ? (
        <Form onSubmit={handlePost} className="mb-3">
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
          />
          <Button type="submit" size="sm">Post Comment</Button>
        </Form>
      ) : (
        <p className="text-muted">Sign in to leave a comment.</p>
      )}

      {comments.length === 0 ? (
        <p className="text-muted mt-2">No comments yet. Be the first!</p>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            username={username}
            onLike={() => likeComment(comment.id)}
            onEdit={editComment}
            onDelete={() => deleteComment(comment.id)}
            onReply={postComment}
          />
        ))
      )}
    </div>
  );
}
