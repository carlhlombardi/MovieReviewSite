"use client";

import React, { useEffect, useState } from 'react';
import { Button, Form, ListGroup, Alert, Spinner } from 'react-bootstrap';

const fetchComments = async (url) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?url=${url}`);
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    return await response.json();
  } catch (error) {
    console.error(error);
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
    console.error(error);
    return null;
  }
};

const deleteComment = async (commentId, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments/${commentId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
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
        console.error(err);
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
      console.error(err);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const success = await deleteComment(commentId, token);
        if (success) {
          setComments(comments.filter(comment => comment.id !== commentId));
        }
      }
    } catch (err) {
      setError('Failed to delete comment');
      console.error(err);
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
            <strong>{comment.userName}</strong> - {new Date(comment.createdAt).toLocaleDateString()}
            <p>{comment.text}</p>
            {user && user.username === comment.userName && (
              <Button
                variant="danger"
                onClick={() => handleDeleteComment(comment.id)}
                className="float-end"
              >
                Delete
              </Button>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
};

export default Comments;
