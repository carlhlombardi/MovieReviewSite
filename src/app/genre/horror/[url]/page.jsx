"use client";

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import Image from 'next/image';
import Comments from '@/app/components/comments/comments';
import { Heart } from 'react-bootstrap-icons'

// Function to fetch movie data
const fetchData = async (url) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/data/horrormovies?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch data error:', error);
    return null;
  }
};

// Function to check if the user is logged in
const checkUserLoggedIn = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to check login status', error);
    return false;
  }
};

const fetchLikeStatus = async (url) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/likes?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch like status');
    }

    const result = await response.json();
    return {
      isLiked: result.isliked || false,
      likeCount: result.likecount || 0,
    };
  } catch (error) {
    console.error('Fetch like status error:', error);
    return { isLiked: false, likeCount: 0 }; // Default values
  }
};

const toggleLike = async (url, action) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/likes${action === 'unlike' ? `?url=${encodeURIComponent(url)}` : ''}`, {
      method: action === 'like' ? 'POST' : 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: action === 'like' ? JSON.stringify({ url }) : undefined
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle like');
    }

    return await response.json();
  } catch (error) {
    console.error('Toggle like error:', error);
    return null; // Default error handling
  }
};

const HorrorPostPage = ({ params }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [likedCount, setLikedCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchDataAndStatus = async () => {
      try {
        const movieData = await fetchData(params.url);
        if (movieData) {
          setData(movieData);
        }

        const userLoggedIn = await checkUserLoggedIn();
        setIsLoggedIn(userLoggedIn);

        if (userLoggedIn) {
          const { isLiked, likeCount } = await fetchLikeStatus(params.url);
          setIsLiked(isLiked);
          setLikedCount(likeCount);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndStatus();
  }, [params.url]);

  const handleLike = async () => {
    const action = isLiked ? 'unlike' : 'like';
    const result = await toggleLike(params.url, action);

    if (result) {
      setIsLiked(action === 'like');
      setLikedCount(result.likeCount || 0); // Ensure correct likeCount
    }
  };

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <div>{error}</div>;
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
      </Row>
      <Row>
        <Col xs={12} className="text-center mt-5">
          {isLoggedIn ? (
            <>
             <Button
                variant={isLiked ? "like" : "danger"}
                onClick={handleLike}
                className="me-2"
              >
                <Heart />
                {isLiked ? ' Unlike' : ' Like'}
              </Button>
              <Comments movieUrl={params.url} />
            </>
          ) : (
            <Alert variant="info">Please log in to like or add to watchlist and to view and post comments.</Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default HorrorPostPage;
