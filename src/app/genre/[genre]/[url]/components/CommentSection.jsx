"use client";

import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import useComments from "../hooks/useComments";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, postComment, editComment, deleteComment, likeComment } =
    useComments(tmdb_id);

  // Flatten tree with levels for indentation
  const flattenComments = (list, level = 0) => {
    return list.flatMap(c => [
      { ...c, level },
      ...(c.replies ? flattenComments(c.replies, level + 1) : []),
    ]);
  };

  const flatComments = flattenComments(comments);

  return (
    <div className="mt-4">
      <h4 className="mb-3">Comments</h4>

      {username ? (
        <CommentForm onSubmit={(text) => postComment(text)} />
      ) : (
        <p className="text-muted">Sign in to leave a comment.</p>
      )}

      {flatComments.length === 0 ? (
        <p className="text-muted mt-2">No comments yet. Be the first!</p>
      ) : (
        flatComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            username={username}
            onLike={() => likeComment(comment.id)}
            onEdit={editComment}
            onDelete={() => deleteComment(comment.id)}
            onReply={(text) => postComment(text, comment.id)}
            level={comment.level} // pass indentation level
          />
        ))
      )}
    </div>
  );
}
