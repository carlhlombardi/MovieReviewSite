"use client";

import React, { useEffect, useState } from 'react';
import { Button, Form, ListGroup, Alert, Spinner, Dropdown } from 'react-bootstrap';
import Link from 'next/link';

// Helper functions for API calls
const fetchComments = async (movieUrl, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?url=${encodeURIComponent(movieUrl)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch comments');
    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

const fetchAllUsers = async (token) => {
  try {
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

const Comments = ({ movieUrl }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [deleteCountdown, setDeleteCountdown] = useState({});
  const [mentionedUser, setMentionedUser] = useState('');

  useEffect(() => {
    const fetchData = async () => {
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
            // Fetch users if admin
            if (userData.is_admin) {
              const usersData = await fetchAllUsers(token);
              setAllUsers(usersData);
            }
          }
          // Fetch comments
          const commentsData = await fetchComments(movieUrl, token);
          setComments(commentsData);
          // Initialize countdown
          const initialCountdown = {};
          commentsData.forEach(comment => {
            if (comment.username === userData.username) {
              const postedTime = new Date(comment.createdat);
              const now = new Date();
              const timeDiff = Math.max(0, 10 - (now - postedTime) / 1000);
              if (timeDiff > 0) {
                initialCountdown[comment.id] = timeDiff;
              }
            }
          });
          setDeleteCountdown(initialCountdown);
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
    // Countdown logic
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
      if (!newComment.trim()) return; // Prevent empty comments

      const token = localStorage.getItem('token');
      if (token && user) {
        const response = await postComment(movieUrl, newComment, token);
        if (response) {
          const postedTime = new Date();
          setComments([...comments, response]);
          setNewComment('');
          // Set countdown for new comment
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
      if (token) {
        const response = await likeComment(commentId, token);
        if (response) {
          setComments(comments.map(comment =>
            comment.id === commentId ? { ...comment, likedByUser: response.likedByUser } : comment
          ));
        }
      }
    } catch (err) {
      setError('Failed to like/unlike comment');
      console.error('Error:', err);
    }
  };

  const handleMention = (username) => {
    setMentionedUser(username);
    setNewComment(prev => `${prev} @${username} `);
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
          {user.is_admin && (
            <Dropdown className="mt-2">
              <Dropdown.Toggle variant="success" id="dropdown-basic">
                Mention User
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {allUsers.map(u => (
                  <Dropdown.Item key={u.id} onClick={() => handleMention(u.username)}>
                    {u.username}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          )}
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
              <>
                <Button
                  variant="danger"
                  onClick={() => handleDeleteComment(comment.id)}
                  className="float-end"
                >
                  Delete
                </Button>
                <small className="text-muted float-end me-2">
                  {deleteCountdown[comment.id] > 0 ? `Delete available for ${deleteCountdown[comment.id]}s` : 'Delete window expired'}
                </small>
              </>
            )}
            {user && (
              <Button
                variant={comment.likedByUser ? "success" : "outline-success"}
                onClick={() => handleLikeComment(comment.id)}
                className="float-end ms-2"
              >
                {comment.likedByUser ? "Unlike" : "Like"}
              </Button>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </>
  );
};

export default Comments;
