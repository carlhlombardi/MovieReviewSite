"use client";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import useComments from "../hooks/useComments";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, postComment, editComment, deleteComment, likeComment } =
    useComments(tmdb_id, username);

  const handleReply = async (parentId, text) => {
    await postComment(text, parentId);
  };

  const handleEdit = async (comment, text) => {
    await editComment(comment.id, text);
  };

  return (
    <div className="mt-4">
      <h4 className="mb-3">💬 Comments</h4>

      {username && <CommentForm onSubmit={postComment} />}

      {comments.length === 0 ? (
        <p className="text-muted">No comments yet. Be the first!</p>
      ) : (
        comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            username={username}
            onLike={likeComment}
            onEdit={handleEdit}
            onDelete={deleteComment}
            onReply={handleReply}
          />
        ))
      )}
    </div>
  );
}
