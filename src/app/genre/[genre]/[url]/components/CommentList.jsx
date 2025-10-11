"use client";
import Comment from "./Comment";

export default function CommentList({
  comments,
  username,
  onLike,
  onReply,
  onEdit,
  onDelete,
}) {
  return (
    <div>
      {comments.map((comment) => (
        <Comment
          key={comment.id}
          comment={comment}
          username={username}
          onLike={onLike}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
