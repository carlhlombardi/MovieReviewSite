"use client";
import Comment from "./Comment";

export default function ReplyList({ replies, username }) {
  return (
    <>
      {replies.map(r => (
        <Comment key={r.id} comment={r} username={username} />
      ))}
    </>
  );
}
