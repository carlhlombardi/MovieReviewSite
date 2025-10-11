"use client";
import { useState } from "react";
import Comment from "./Comment";
import useComments from "../hooks/useComments";
import { Button, Form } from "react-bootstrap";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, loading, error, postComment } = useComments(tmdb_id);
  const [newComment, setNewComment] = useState("");

  const handlePost = async () => {
    if (!newComment.trim()) return;
    try {
      await postComment(newComment);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <Form.Group className="mb-3">
        <Form.Control
          as="textarea"
          rows={2}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button className="mt-2" onClick={handlePost} variant="primary">
          Comment
        </Button>
      </Form.Group>

      {loading && <p>Loading comments...</p>}
      {error && <p className="text-danger">{error}</p>}

      {comments.map(c => (
        <Comment
          key={c.id}
          comment={c}
          username={username}
          postComment={postComment}
          editComment={() => {}}
          deleteComment={() => {}}
        />
      ))}
    </div>
  );
}
