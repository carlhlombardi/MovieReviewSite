"use client";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import useComments from "../hooks/useComments";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, postComment, editComment, deleteComment, likeComment } =
    useComments(tmdb_id);

  // 🔹 Inline reply — CommentItem will call onReply(text, parentId)
  const handleReply = (text, parentId) => {
    if (text?.trim()) postComment(text.trim(), parentId);
  };

  // 🔹 Inline edit — CommentItem will call onEdit(id, text)
  const handleEdit = (id, text) => {
    if (text?.trim()) editComment(id, text.trim());
  };

  return (
    <div className="mt-4">
      <h4 className="mb-3">Comments</h4>

      {username ? (
        <CommentForm onSubmit={postComment} />
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
            onEdit={handleEdit}        // ✅ passes edit handler with args
            onDelete={() => deleteComment(comment.id)}
            onReply={handleReply}      // ✅ passes reply handler with args
          />
        ))
      )}
    </div>
  );
}
