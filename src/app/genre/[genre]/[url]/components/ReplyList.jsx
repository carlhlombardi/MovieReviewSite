"use client";
import Comment from "./Comment";

export default function ReplyList({ replies, username, onLike, onEdit, onDelete, onReply }) {
  return (
    <>
      {replies.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          username={username}
          onLike={onLike}
          onEdit={onEdit}
          onDelete={onDelete}
          onReply={onReply}
        />
      ))}
    </>
  );
}
