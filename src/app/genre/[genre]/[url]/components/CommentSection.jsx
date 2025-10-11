"use client";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import useComments from "../hooks/useComments";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, postComment, editComment, deleteComment, likeComment } =
    useComments(tmdb_id);

  // Inline reply
  const handleReply = async (text, parentId) => {
    if (!text?.trim()) return;

    // Optimistic update
    await postComment(text.trim(), parentId);
  };

  // Inline edit
  const handleEdit = async (id, text) => {
    if (!text?.trim()) return;

    // Optimistic update
    await editComment(id, text.trim());
  };

  // Inline delete
  const handleDelete = async (id) => {
    await deleteComment(id);
  };

  // Inline like/unlike
  const handleLike = async (id) => {
    await likeComment(id);
  };

  return (
    <div className="mt-4">
      <h4 className="mb-3">Comments</h4>

      {username ? (
        <CommentForm onSubmit={(text) => postComment(text)} />
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
            onLike={() => handleLike(comment.id)}
            onEdit={handleEdit}
            onDelete={() => handleDelete(comment.id)}
            onReply={handleReply}
          />
        ))
      )}
    </div>
  );
}
