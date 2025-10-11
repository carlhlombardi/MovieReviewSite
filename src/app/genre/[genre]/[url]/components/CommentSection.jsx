"use client";
import { Spinner } from "react-bootstrap";
import useComments from "../hooks/useComments";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

export default function CommentSection({ tmdb_id, username }) {
  const {
    comments,
    loading,
    addComment,
    likeComment,
    editComment,
    deleteComment,
  } = useComments(tmdb_id);

  return (
    <div>
      <h5 className="mb-3">Comments</h5>

      <CommentForm
        onSubmit={(content) => addComment(content)}
        placeholder="Add a comment..."
      />

      {loading ? (
        <div className="d-flex justify-content-center mt-3">
          <Spinner animation="border" />
        </div>
      ) : (
        <CommentList
          comments={comments}
          username={username}
          onLike={likeComment}
          onReply={addComment}
          onEdit={editComment}
          onDelete={deleteComment}
        />
      )}
    </div>
  );
}
