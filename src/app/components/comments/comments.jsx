"use client";

import React, { useEffect, useState } from 'react';
import { Button, Form, ListGroup, Alert, Spinner } from 'react-bootstrap';
import Link from 'next/link';

// Helper functions for API calls
const fetchComments = async (movieUrl) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?url=${encodeURIComponent(movieUrl)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

const postComment = async (url, text, token) => {
  try {
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ url, text })
    });
    if (!response.ok) {
      throw new Error('Failed to submit comment');
    }
    return await response.json();
  } catch (error) {
    console.error('Error posting comment:', error);
    return null;
  }
};

const deleteComment = async (id, movieUrl, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?id=${encodeURIComponent(id)}&url=${encodeURIComponent(movieUrl)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error deleting comment:', errorData);
      throw new Error(`Failed to delete comment: ${errorData.message}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};

const likeComment = async (id, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments/like?id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to like comment');
    }
    return await response.json();
  } catch (error) {
    console.error('Error liking comment:', error);
    return null;
  }
};

const Comments = ({ movieUrl }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null); // Current logged-in user

  useEffect(() => {
    const fetchCommentsAsync = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Fetch user information
          const userResponse = await fetch('https://movie-review-site-seven.vercel.app/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setUser(userData);
          }
        }
        // Fetch comments
        const commentsData = await fetchComments(movieUrl);
        setComments(commentsData);
      } catch (err) {
        setError('Failed to load comments');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommentsAsync();
  }, [movieUrl]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newComment.trim()) return; // Prevent empty comments

      const token = localStorage.getItem('token');
      if (token && user) {
        const response = await postComment(movieUrl, newComment, token);
        if (response) {
          setComments([...comments, response]);
          setNewComment('');
        }
      }
    } catch (err) {
      setError('Failed to submit comment');
      console.error('Error:', err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const success = await deleteComment(commentId, movieUrl, token);
        if (success) {
          setComments(comments.filter(comment => comment.id !== commentId));
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
      if (token) {
        const response = await likeComment(commentId, token);
        if (response) {
          // Update comment state with the new like status
          setComments(comments.map(comment =>
            comment.id === commentId ? { ...comment, likedByUser: response.likedByUser } : comment
          ));
        }
      }
    } catch (err) {
      setError('Failed to like comment');
      console.error('Error:', err);
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
            </Link> - {new Date(comment.createdat).toLocaleDateString()}
            <p>{comment.text}</p>
            {user && user.username === comment.username && (
              <Button
                variant="danger"
                onClick={() => handleDeleteComment(comment.id)}
                className="float-end"
              >
                Delete
              </Button>
            )}
            {user && (
              <Button
                variant={comment.likedByUser ? "success" : "outline-success"}
                onClick={() => handleLikeComment(comment.id)}
                className="float-end ms-2"
              >
                {comment.likedByUser ? "Liked" : "Like"}
              </Button>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
};

export default Comments;
