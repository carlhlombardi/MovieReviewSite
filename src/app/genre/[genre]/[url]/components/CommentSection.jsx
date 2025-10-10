"use client";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import useComments from "../hooks/useComments";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, postComment, editComment, deleteComment, likeComment } =
    useComments(tmdb_id);

  const handleReply = (parentId) => {
    const reply = prompt("Reply to this comment:");
    if (reply?.trim()) postComment(reply.trim(), parentId);
  };

  const handleEdit = (comment) => {
    const text = prompt("Edit your comment:", comment.content);
    if (text?.trim()) editComment(comment.id, text.trim());
  };

  return (
    <div className="mt-4">
      <h4 className="mb-3">💬 Comments</h4>

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
            onEdit={() => handleEdit(comment)}
            onDelete={() => deleteComment(comment.id)}
            onReply={() => handleReply(comment.id)}
          />
        ))
      )}
    </div>
  );
}
