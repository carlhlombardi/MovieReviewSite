"use client";

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import Image from 'next/image';
import Comments from '@/app/components/comments/comments';

// Function to fetch data for a specific movie URL
const fetchData = async (url) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/data/horrormovies?url=${encodeURIComponent(url)}`);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const data = await response.json();
    return data;
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

// Function to interact with Liked and Watchlist APIs
const updateMovieStatus = async (url, genre, action) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/${action}`, {
      method: action === 'liked' ? 'POST' : 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ movie_id: url, genre })
    });
    if (!response.ok) {
      throw new Error(`Failed to ${action} movie`);
    }
  } catch (error) {
    console.error(`Error in ${action} movie:`, error);
  }
};

const HorrorPostPage = ({ params }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [likedCount, setLikedCount] = useState(0);
  const [watchlistCount, setWatchlistCount] = useState(0);

  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        const result = await fetchData(params.url); // Fetch movie data by `url`
        setData(result);

        const loggedIn = await checkUserLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          // Fetch counts for liked and watchlisted
          const likedResponse = await fetch(`https://movie-review-site-seven.vercel.app/api/liked/count?url=${encodeURIComponent(params.url)}`);
          const watchlistResponse = await fetch(`https://movie-review-site-seven.vercel.app/api/watchlist/count?url=${encodeURIComponent(params.url)}`);

          if (likedResponse.ok) {
            const likedData = await likedResponse.json();
            setLikedCount(likedData.count);
          }

          if (watchlistResponse.ok) {
            const watchlistData = await watchlistResponse.json();
            setWatchlistCount(watchlistData.count);
          }
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAsync();
  }, [params.url]);

  const handleLike = async () => {
    await updateMovieStatus(params.url, data.genre, 'liked');
    setLikedCount(prevCount => prevCount + 1);
  };

  const handleWatchlist = async () => {
    await updateMovieStatus(params.url, data.genre, 'watchlist');
    setWatchlistCount(prevCount => prevCount + 1);
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

  const { film, year, studio, director, screenwriters, producer, total_kills, men, women, run_time, my_rating, review, image_url, genre } = data;

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
              <Button variant="primary" onClick={handleLike} className="me-2">
                Like ({likedCount})
              </Button>
              <Button variant="secondary" onClick={handleWatchlist}>
                Add to Watchlist ({watchlistCount})
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
