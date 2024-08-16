"use client";

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button, Form, ListGroup, Alert, Spinner } from 'react-bootstrap';
import Image from 'next/image';
import axios from 'axios';

const fetchData = async (url) => {
  try {
    const response = await fetch(`/api/data/horrormovies`);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const data = await response.json();
    const filteredData = data.filter(item => item.url === url);
    return filteredData.length > 0 ? filteredData[0] : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const Page = ({ params }) => {
  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null); // Current logged-in user

  useEffect(() => {
    const fetchDataAsync = async () => {
      const result = await fetchData(params.url);
      setData(result);

      try {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (token) {
          // Fetch user information
          const userResponse = await axios.get('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
          setUser(userResponse.data);
        }
        
        // Fetch comments
        const commentsResponse = await axios.get(`/api/comments?url=${params.url}`);
        setComments(commentsResponse.data);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAsync();
  }, [params.url]);

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!newComment) return;

      const token = localStorage.getItem('token');
      if (token) {
        const response = await axios.post('/api/comments', { url: params.url, text: newComment }, { headers: { Authorization: `Bearer ${token}` } });
        setComments([...comments, response.data]);
        setNewComment('');
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
        await axios.delete(`/api/comments/${commentId}`, { headers: { Authorization: `Bearer ${token}` } });
        setComments(comments.filter(comment => comment.id !== commentId));
      }
    } catch (err) {
      setError('Failed to delete comment');
      console.error(err);
    }
  };

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  if (!data) {
    return <div>No data found</div>;
  }

  const { film, year, studio, director, screenwriters, producer, total_kills, men, women, run_time, my_rating, review, image_url } = data;

  return (
    <Container>
      <Row>
        <Col xs={12} md={6} className="text-center order-md-2 mt-5 mb-3">
          <div className="image-wrapper">
            {image_url ? (
              <Image
                src={image_url}
                alt={film}
                width={300}
                height={450}
              />
            ) : (
              <div>No image available</div>
            )}
          </div>
        </Col>
        <Col xs={12} md={6} className="text-center m-auto order-md-1">
          <h1 className='mb-4'>{film}</h1>
          <h5>Director: {director}</h5>
          <h5>Screenwriter(s): {screenwriters}</h5>
          <h5>Producer(s): {producer}</h5>
          <h5>Studio: {studio}</h5>
          <h5>Year: {year}</h5>
        </Col>
        <Col xs={12} md={6} className="text-center m-auto order-md-3">
          <h2 className='mb-4'>The Stats</h2>
          <h6>Run Time: {run_time} Minutes</h6>
          <h6>Total Kills: {total_kills} Kills</h6>
          <h6>Men: {men} Killed</h6>
          <h6>Women: {women} Killed</h6>
        </Col>
        <Col xs={12} md={6} className="text-center m-auto order-md-4">
          <h3 className='mb-4'>Review of {film}</h3>
          <p>{review}</p>
          <h3>My Rating: {my_rating} Stars</h3>
        </Col>
        {user && (
          <Col xs={12} className="mt-5">
            <h3>Add a Comment</h3>
            <Form onSubmit={handleCommentSubmit}>
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
          </Col>
        )}
        <Col xs={12} className="mt-5">
          <h3>Comments</h3>
          {error && <Alert variant="danger">{error}</Alert>}
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
        </Col>
      </Row>
    </Container>
  );
};

export default Page;
