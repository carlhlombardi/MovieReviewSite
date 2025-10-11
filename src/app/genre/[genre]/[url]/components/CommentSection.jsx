"use client";
import CommentList from "./CommentList";
import useComments from "../hooks/useComments";
import { useAuth } from "@/app/(auth)/context/AuthContext";

export default function CommentSection({ tmdb_id }) {
  const { isLoggedIn, user } = useAuth();
  const { comments, loading, error, postComment, editComment, deleteComment, likeComment } = useComments(tmdb_id);

  if (loading) return <p>Loading comments...</p>;
  if (error) return <p className="text-danger">Error: {error}</p>;

  return (
    <CommentList
      comments={comments}
      username={user?.username}
      onPost={postComment}
      onEdit={editComment}
      onDelete={deleteComment}
      onLike={likeComment}
    />
  );
}
