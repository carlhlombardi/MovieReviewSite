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

// Function to get the status of the movie in liked and watchlist
const fetchMovieStatus = async (url, genre) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return { isLiked: false, isInWatchlist: false };

    const [likedResponse, watchlistResponse] = await Promise.all([
      fetch('https://movie-review-site-seven.vercel.app/api/auth/liked', {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch('https://movie-review-site-seven.vercel.app/api/auth/watchlist', {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    if (!likedResponse.ok || !watchlistResponse.ok) {
      throw new Error('Failed to fetch movie status');
    }

    const [likedData, watchlistData] = await Promise.all([
      likedResponse.json(),
      watchlistResponse.json()
    ]);

    const isLiked = likedData.some(item => item.url === url && item.genre === genre);
    const isInWatchlist = watchlistData.some(item => item.url === url && item.genre === genre);

    return { isLiked, isInWatchlist };
  } catch (error) {
    console.error('Error fetching movie status:', error);
    return { isLiked: false, isInWatchlist: false };
  }
};

// Function to handle like and watchlist actions
const handleMovieAction = async (url, genre, action, shouldAdd) => {
  try {
    const token = localStorage.getItem('token');
    const endpoint = `https://movie-review-site-seven.vercel.app/api/auth/${action}`;
    const method = shouldAdd ? 'POST' : 'DELETE';
    
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: shouldAdd ? JSON.stringify({ url, genre }) : undefined
    });

    if (!response.ok) {
      throw new Error(`Failed to ${shouldAdd ? action : `remove ${action}`}`);
    }

    console.log(`${action} action successful`);
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
  const [isLiked, setIsLiked] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);

  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        const result = await fetchData(params.url); // Fetch movie data by `url`
        setData(result);

        const loggedIn = await checkUserLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          // Fetch current status of the movie for the logged-in user
          const { isLiked, isInWatchlist } = await fetchMovieStatus(params.url, result.genre);
          setIsLiked(isLiked);
          setIsInWatchlist(isInWatchlist);

          // Fetch counts for liked and watchlisted
          const likedResponse = await fetch('https://movie-review-site-seven.vercel.app/api/auth/liked', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          const watchlistResponse = await fetch('https://movie-review-site-seven.vercel.app/api/auth/watchlist', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });

          if (likedResponse.ok) {
            const likedData = await likedResponse.json();
            setLikedCount(likedData.length);
          }

          if (watchlistResponse.ok) {
            const watchlistData = await watchlistResponse.json();
            setWatchlistCount(watchlistData.length);
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
    await handleMovieAction(params.url, data.genre, 'liked', !isLiked);
    setLikedCount(prevCount => isLiked ? prevCount - 1 : prevCount + 1);
    setIsLiked(!isLiked);
  };

  const handleWatchlist = async () => {
    await handleMovieAction(params.url, data.genre, 'watchlist', !isInWatchlist);
    setWatchlistCount(prevCount => isInWatchlist ? prevCount - 1 : prevCount + 1);
    setIsInWatchlist(!isInWatchlist);
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
                variant={isLiked ? "danger" : "primary"}
                onClick={handleLike}
                className="me-2"
              >
                {isLiked ? `Unlike (${likedCount})` : `Like (${likedCount})`}
              </Button>
              <Button
                variant={isInWatchlist ? "warning" : "secondary"}
                onClick={handleWatchlist}
              >
                {isInWatchlist ? `Remove from Watchlist (${watchlistCount})` : `Add to Watchlist (${watchlistCount})`}
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
