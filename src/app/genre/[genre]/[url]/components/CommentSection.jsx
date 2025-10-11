"use client";
import { Spinner } from "react-bootstrap";
import Comment from "./Comment";
import useComments from "../hooks/useComments";

export default function CommentSection({ tmdb_id, username }) {
  const { comments, loading, postComment, editComment, deleteComment, likeComment, setComments } = useComments(tmdb_id);

  const handleReply = async (content, parent_id) => {
    const newComment = await postComment(content, parent_id);
    if (parent_id) {
      setComments(prev =>
        prev.map(c => c.id === parent_id
          ? { ...c, replies: [...(c.replies || []), newComment] }
          : c
        )
      );
    } else {
      setComments(prev => [newComment, ...prev]);
    }
  };

  if (loading) return <Spinner animation="border" />;

  return (
    <div>
      {comments.map(comment => (
        <Comment
          key={comment.id}
          comment={comment}
          username={username}
          onLike={likeComment}
          onReply={handleReply}
          onEdit={editComment}
          onDelete={deleteComment}
        />
      ))}
    </div>
  );
}
