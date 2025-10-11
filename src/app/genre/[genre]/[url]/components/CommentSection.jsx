"use client";

import CommentItem from "./CommentItem";
import useComments from "../hooks/useComments";
import { useState } from "react";
import { Form, Button, Spinner } from "react-bootstrap";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, loading, postComment, editComment, deleteComment, likeComment } = useComments(tmdb_id);
  const [newComment, setNewComment] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment?.trim()) return;
    await postComment(newComment.trim());
    setNewComment("");
  };

  if (loading) return <Spinner animation="border" className="d-block mx-auto my-3" />;

  return (
    <div>
      <Form onSubmit={handleSubmit} className="mb-3">
        <Form.Control
          as="textarea"
          rows={2}
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="mb-2"
        />
        <Button type="submit" size="sm" variant="primary">Post Comment</Button>
      </Form>

      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          username={username}
          onEdit={editComment}
          onDelete={() => deleteComment(c.id)}
          onLike={() => likeComment(c.id)}
          onReply={(content, parentId) => postComment(content, parentId)}
          level={0}
        />
      ))}
    </div>
  );
}
