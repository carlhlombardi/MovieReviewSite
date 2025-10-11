"use client";

import { useState } from "react";
import CommentItem from "./CommentItem";
import { Form, Button, Spinner } from "react-bootstrap";

export default function CommentSection({ tmdb_id, username, useCommentsHook }) {
  const { comments, loading, postComment, editComment, deleteComment, likeComment } = useCommentsHook(tmdb_id);
  const [newComment, setNewComment] = useState("");

  const handlePost = async (content, parent_id = null) => {
    await postComment(content, parent_id);
    setNewComment("");
  };

  if (loading) return <Spinner animation="border" className="d-block mx-auto my-3" />;

  return (
    <div>
      {/* New top-level comment */}
      {username && (
        <Form onSubmit={(e) => { e.preventDefault(); handlePost(newComment); }}>
          <Form.Control
            as="textarea"
            rows={2}
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="mb-2"
          />
          <Button type="submit" size="sm">Post</Button>
        </Form>
      )}

      {/* Comments tree */}
      {comments.map((c) => (
        <CommentItem
          key={c.id}
          comment={c}
          username={username}
          onLike={() => likeComment(c.id)}
          onEdit={editComment}
          onDelete={() => deleteComment(c.id)}
          onReply={(text, parent_id) => handlePost(text, parent_id)}
          level={0} // top-level
        />
      ))}
    </div>
  );
}
