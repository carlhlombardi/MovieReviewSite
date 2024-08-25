"use client"

import React, { useEffect, useState } from 'react';
import { Button, Form, ListGroup, Alert, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import ReplyComponent from './ReplyComponent';
import { 
  fetchComments, 
  postReply, 
  fetchReplies, 
  postComment, 
  deleteComment, 
  likeComment, 
  likeReply, 
  postReplyToReply 
} from '@/app/api/helpers/api';

const Comments = ({ movieUrl }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTexts, setReplyTexts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [deleteCountdown, setDeleteCountdown] = useState({});
  const [replies, setReplies] = useState({});
  const [likedReplies, setLikedReplies] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userResponse = await fetch('https://movie-review-site-seven.vercel.app/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
          }
          // Fetch comments
          const commentsData = await fetchComments(movieUrl, token);
          setComments(commentsData.map(comment => ({
            ...comment,
            likedByUser: comment.likedByUser || false
          })));
          
          // Fetch replies for each comment
          const repliesData = {};
          for (const comment of commentsData) {
            const commentReplies = await fetchReplies(comment.id, token);
            repliesData[comment.id] = commentReplies;
          }
          setReplies(repliesData);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchData();
  }, [movieUrl]);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setDeleteCountdown(prevCountdown => {
        const updatedCountdown = { ...prevCountdown };
        Object.keys(updatedCountdown).forEach(id => {
          updatedCountdown[id] = Math.max(0, updatedCountdown[id] - 1);
          if (updatedCountdown[id] <= 0) {
            delete updatedCountdown[id];
          }
        });
        return updatedCountdown;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newComment.trim()) return;

      const token = localStorage.getItem('token');
      if (token && user) {
        const response = await postComment(movieUrl, newComment, token);
        if (response) {
          setComments(prevComments => [...prevComments, response]);
          setNewComment('');
          if (user.username === response.username) {
            setDeleteCountdown(prevCountdown => ({
              ...prevCountdown,
              [response.id]: 10
            }));
          }
        }
      }
    } catch (err) {
      setError('Failed to submit comment');
      console.error('Error:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
  };
  
  const handleReplyChange = (commentId, value) => {
    setReplyTexts(prevReplyTexts => ({
      ...prevReplyTexts,
      [commentId]: value
    }));
  };
  
  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const success = await deleteComment(commentId, movieUrl, token);
        if (success) {
          setComments(comments.filter(comment => comment.id !== commentId));
          setDeleteCountdown(prevCountdown => {
            const updatedCountdown = { ...prevCountdown };
            delete updatedCountdown[commentId];
            return updatedCountdown;
          });
        }
      }
    } catch (err) {
      setError('Failed to delete comment');
      console.error('Error:', err);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found');
        return;
      }
  
      const response = await likeComment(commentId, token);
  
      if (response) {
        setComments(prevComments =>
          prevComments.map(comment =>
            comment.id === commentId
              ? { ...comment, likedByUser: response.likedByUser }
              : comment
          )
        );
      } else {
        console.error('Failed to get like status from server');
      }
    } catch (err) {
      setError('Failed to like/unlike comment');
      console.error('Error:', err);
    }
  };

  const handleLikeReply = async (replyId) => {
    try {
      const data = await likeReply(replyId);
      if (data) {
        setLikedReplies(prev => ({
          ...prev,
          [replyId]: data.likedByUser
        }));
      }
    } catch (error) {
      setError('Failed to like/unlike reply');
      console.error('Error liking reply:', error);
    }
  };

  const handleReplyAction = async (commentId, parentReplyId = null) => {
    try {
      const replyText = replyTexts[commentId]?.trim();
      if (!replyText) return;
  
      const token = localStorage.getItem('token');
      if (token && user) {
        const response = parentReplyId
          ? await postReplyToReply(parentReplyId, replyText)
          : await postReply(commentId, replyText, token);
          
        if (response) {
          setReplies(prevReplies => {
            const updatedReplies = {
              ...prevReplies,
              [commentId]: [...(prevReplies[commentId] || []), response]
            };
            return updatedReplies;
          });
          setReplyTexts(prevReplyTexts => ({
            ...prevReplyTexts,
            [commentId]: ''
          }));
        } else {
          const errorData = await response.json();
          console.error('Failed to submit reply:', errorData.message);
        }
      }
    } catch (err) {
      setError('Failed to submit reply');
      console.error('Error:', err);
    }
  };
  
  const handlePostReplyToReply = async (parentReplyId) => {
    try {
      const replyText = replyTexts[parentReplyId]?.trim();
      if (!replyText) return;

      const replyData = await postReplyToReply(parentReplyId, replyText);
  
      if (replyData) {
        setReplies(prevReplies => {
          const updatedReplies = { ...prevReplies };
          if (!updatedReplies[parentReplyId]) {
            updatedReplies[parentReplyId] = [];
          }
          updatedReplies[parentReplyId] = [...updatedReplies[parentReplyId], replyData];
          return updatedReplies;
        });
        setReplyTexts(prevReplyTexts => ({
          ...prevReplyTexts,
          [parentReplyId]: ''
        }));
      }
    } catch (error) {
      console.error('Failed to post reply:', error);
      setError('Failed to post reply');
    }
  };

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  return (
    <>
      <h3>Comments</h3>
      {error && <Alert variant="danger">{error}</Alert>}
      {user && (
        <Form onSubmit={handleCommentSubmit} className="mb-4">
          <Form.Group controlId="commentText">
            <Form.Control
              as="textarea"
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add your comment"
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-2">Submit</Button>
        </Form>
      )}
      <ListGroup>
        {comments.map(comment => (
          <ListGroup.Item key={comment.id}>
            <Link href={`/profile/${comment.username}`} passHref>
              <a>
                <strong>{comment.username}</strong>
              </a>
            </Link> - {formatDate(comment.createdat)}
            <p>{comment.text}</p>
            {user && user.username === comment.username && (
              <>
                {deleteCountdown[comment.id] > 0 && (
                  <>
                    <Button
                      variant="danger"
                      onClick={() => handleDeleteComment(comment.id)}
                      className="float-end"
                    >
                      Delete
                    </Button>
                    <small className="text-muted float-end me-2">
                      Delete available for {deleteCountdown[comment.id]}s
                    </small>
                  </>
                )}
              </>
            )}
            {user && (
              <Button
                variant={comment.likedByUser ? "outline-success" : "success"}
                onClick={() => handleLikeComment(comment.id)}
                className="float-end ms-2"
              >
                {comment.likedByUser ? "Unlike" : "Like"}
              </Button>
            )}
            {user && (
              <Form onSubmit={(e) => { 
                e.preventDefault(); 
                handleReplyAction(comment.id); 
              }} className="mb-4">
                <Form.Group>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={replyTexts[comment.id] || ''}
                    onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                    placeholder={`Reply to ${comment.username}`}
                  />
                </Form.Group>
                <Button variant="primary" type="submit" className="mt-2">Reply</Button>
              </Form>
            )}
            <div className="mt-3">
              {replies[comment.id]?.length ? (
                replies[comment.id].map(reply => (
                  <ReplyComponent
                    key={reply.id}
                    reply={reply}
                    user={user}
                    handleLikeReply={handleLikeReply}
                    handlePostReplyToReply={handlePostReplyToReply}
                    replyTexts={replyTexts}
                    handleReplyChange={handleReplyChange}
                    replies={replies}
                    formatDate={formatDate}
                    likedReplies={likedReplies}
                  />
                ))
              ) : (
                <div>No replies yet.</div>
              )}
            </div>
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
};

export default Comments;