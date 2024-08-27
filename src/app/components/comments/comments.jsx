"use client"

import React, { useEffect, useState } from 'react';
import { Button, Form, ListGroup, Alert, Spinner } from 'react-bootstrap';
import Link from 'next/link';
import { Heart, HeartFill } from 'react-bootstrap-icons';
import ReplyComponent from './replycomponent';

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

const postReply = async (commentId, text, token) => {
  return fetch(`https://movie-review-site-seven.vercel.app/api/auth/replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ commentId, text })
  });
};

const fetchReplies = async (commentId, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/replies?commentId=${encodeURIComponent(commentId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error('Failed to fetch replies');
    return await response.json();
  } catch (error) {
    console.error('Error fetching replies:', error);
    return [];
  }
};

const postComment = async (url, text, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments`, {
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

const likeReply = async (replyId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/replies/liked-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ replyId })
    });

    if (!response.ok) throw new Error('Failed to like reply');

    const data = await response.json();
    return data; // Return the data to handle in the calling function
  } catch (error) {
    console.error('Error liking reply:', error);
    return null; // Return null to indicate failure
  }
};

const postReplyToReply = async (parentReplyId, text) => {
  try {
    console.log('postReplyToReply called with:', { parentReplyId, text });

    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/replies/reply-to-reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ replyId: parentReplyId, text })
    });

    if (!response.ok) {
      console.error('Failed to post reply, response status:', response.status);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error('Failed to post reply');
    }

    const replyData = await response.json();
    console.log('Reply posted successfully:', replyData);
    return replyData;
  } catch (error) {
    console.error('Failed to post reply:', error);
    return null;
  }
};





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
          console.log('Fetched Replies Data:', repliesData); // Log to check structure
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
      const data = await likeReply(replyId); // Assume likeReply updates the server and returns the updated reply
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
          
        console.log('Response:', response); // Log raw response
        const replyData = await response.json();
        console.log('Reply Data:', replyData); // Log parsed reply data
  
        if (response.ok) {
          setReplies(prevReplies => {
            const updatedReplies = {
              ...prevReplies,
              [commentId]: [...(prevReplies[commentId] || []), replyData]
            };
            console.log('Updated replies state:', updatedReplies);
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
      console.log('Reply text for parentReplyId', parentReplyId, ':', replyText);
  
      if (!replyText) {
        console.log('No text to post for parentReplyId', parentReplyId);
        return; // No text to post
      }
  
      console.log('Calling postReplyToReply with:', { parentReplyId, replyText });
      const replyData = await postReplyToReply(parentReplyId, replyText);
  
      if (replyData) {
        console.log('Reply data received:', replyData);
        setReplies(prevReplies => {
          const updatedReplies = { ...prevReplies };
          if (!updatedReplies[parentReplyId]) {
            updatedReplies[parentReplyId] = [];
          }
          updatedReplies[parentReplyId] = [...updatedReplies[parentReplyId], replyData];
          console.log('Updated replies:', updatedReplies);
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
             {user && (
               <Button 
               variant="link" 
               onClick={() => handleLikeComment(comment.id)}
               style={{ padding: 0, display: 'inline-flex', alignItems: 'center' }} // Optional styling to fit icon better
             >
               {comment.likedByUser ? (
                 <HeartFill color="red" size={14} />
               ) : (
                 <Heart color="grey" size={14} />
               )}
             </Button>
            )}
            <Link href={`/profile/${comment.username}`} passHref>
              <a>
                <strong> {comment.username}</strong>
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