"use client";

import React, { useEffect, useState } from 'react';
import { Button, Form, ListGroup, Alert, Spinner, Dropdown } from 'react-bootstrap';
import Link from 'next/link';

// Helper functions for API calls
const fetchComments = async (movieUrl, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?url=${encodeURIComponent(movieUrl)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
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
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/comments/liked-comments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ commentId: id })
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

// Fetch and filter users
const fetchUserList = async (searchTerm = '') => {
  try {
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/users');
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    const users = await response.json();
    return users.filter(user => user.username.toLowerCase().includes(searchTerm.toLowerCase()));
  } catch (error) {
    console.error('Error fetching user list:', error);
    return [];
  }
};

const Comments = ({ movieUrl }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null); // Current logged-in user
  const [deleteCountdown, setDeleteCountdown] = useState({}); // Track delete countdown for each comment
  const [userList, setUserList] = useState([]); // List of users for mentions
  const [filteredUsers, setFilteredUsers] = useState([]); // Filtered list of users based on search
  const [mentioning, setMentioning] = useState(false); // Whether we're in mention mode
  const [mentionStart, setMentionStart] = useState(0); // Start position of mention
  const [mentionEnd, setMentionEnd] = useState(0); // End position of mention

  useEffect(() => {
    const fetchCommentsAsync = async () => {
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
          const commentsData = await fetchComments(movieUrl, token);
          setComments(commentsData);
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
        setError('Failed to load comments');
        console.error('Error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommentsAsync();
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

  useEffect(() => {
    // Fetch user list for mentions
    const fetchUsers = async () => {
      const users = await fetchUserList();
      setUserList(users);
    };

    fetchUsers();
  }, []);

  const handleCommentChange = async (e) => {
    const text = e.target.value;
    setNewComment(text);

    // Handle mention logic
    const mentionIndex = text.lastIndexOf('@');
    if (mentionIndex > -1) {
      setMentioning(true);
      setMentionStart(mentionIndex);
      setMentionEnd(text.length);
      const query = text.substring(mentionIndex + 1);
      const users = await fetchUserList(query);
      setFilteredUsers(users);
    } else {
      setMentioning(false);
      setFilteredUsers([]);
    }
  };

  const handleSuggestionClick = (username) => {
    const updatedComment = `${newComment.substring(0, mentionStart)}@${username} `;
    setNewComment(updatedComment);
    setMentioning(false);
    setFilteredUsers([]);
  };

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
              onChange={handleCommentChange}
              placeholder="Add your comment"
            />
          </Form.Group>
          <Button variant="primary" type="submit" className="mt-2">Submit</Button>
          {mentioning && filteredUsers.length > 0 && (
            <Dropdown className="mt-2">
              <Dropdown.Menu>
                {filteredUsers.map(user => (
                  <Dropdown.Item
                    key={user.id}
                    onClick={() => handleSuggestionClick(user.username)}
                  >
                    {user.username}
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
            <p>{parseCommentText(comment.text)}</p>
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
