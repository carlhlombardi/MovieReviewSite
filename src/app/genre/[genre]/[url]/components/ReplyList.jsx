"use client";
import Comment from "./Comment";
import useReplies from "../hooks/useReplies";
import { Button } from "react-bootstrap";

export default function ReplyList({
  replies = [], // ✅ default to empty array
  username,
  onLike,
  onReply,
  onEdit,
  onDelete,
}) {
  const { visibleReplies, hasMore, loadMore } = useReplies(replies);

  if (!replies.length) return null;

  return (
    <div>
      {visibleReplies.map((reply) => (
        <Comment
          key={reply.id}
          comment={reply}
          username={username}
          onLike={onLike}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}

      {hasMore && (
        <Button variant="link" size="sm" className="ps-0" onClick={loadMore}>
          View more replies
        </Button>
      )}
    </div>
  );
}
