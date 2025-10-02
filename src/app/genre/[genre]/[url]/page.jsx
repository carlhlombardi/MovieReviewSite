'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import Image from 'next/image';
import Comments from '@/app/components/footer/comments/comments';
import { Heart, HeartFill, Tv, TvFill } from 'react-bootstrap-icons';

// === ✅ Helper Functions ===

const fetchData = async (genre, slug) => {
  try {
    const response = await fetch(
      `https://movie-review-site-seven.vercel.app/api/data/${genre}movies?slug=${encodeURIComponent(slug)}`
    );
    if (!response.ok) throw new Error('Failed to fetch movie data');
    return await response.json();
  } catch (error) {
    console.error('Fetch data error:', error);
    return null;
  }
};

const checkUserLoggedIn = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch (error) {
    console.error('Login check failed', error);
    return false;
  }
};

const fetchLikeStatus = async (slug) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `https://movie-review-site-seven.vercel.app/api/auth/likes?slug=${encodeURIComponent(slug)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error('Like status fetch failed');
    const data = await response.json();
    return {
      isLiked: data.isliked || false,
      likeCount: data.likecount || 0,
    };
  } catch (error) {
    console.error('Fetch like error:', error);
    return { isLiked: false, likeCount: 0 };
  }
};

const fetchWatchlistStatus = async (slug) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `https://movie-review-site-seven.vercel.app/api/auth/watchlist?slug=${encodeURIComponent(slug)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error('Watchlist status fetch failed');
    const data = await response.json();
    return {
      isWatched: data.iswatched || false,
      watchCount: data.watchcount || 0,
    };
  } catch (error) {
    console.error('Fetch watch error:', error);
    return { isWatched: false, watchCount: 0 };
  }
};

const toggleWatchlist = async (slug, action) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Token missing');
    const fetchUrl = `https://movie-review-site-seven.vercel.app/api/auth/watchlist${action === 'remove' ? `?slug=${encodeURIComponent(slug)}` : ''}`;
    const response = await fetch(fetchUrl, {
      method: action === 'add' ? 'POST' : 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: action === 'add' ? JSON.stringify({ slug }) : undefined,
    });
    if (!response.ok) throw new Error('Failed to toggle watchlist');
    return await response.json();
  } catch (error) {
    console.error('Watchlist toggle failed', error);
    return null;
  }
};

const toggleLike = async (slug, action) => {
  try {
    const token = localStorage.getItem('token');
    const fetchUrl = `https://movie-review-site-seven.vercel.app/api/auth/likes${action === 'unlike' ? `?slug=${encodeURIComponent(slug)}` : ''}`;
    const response = await fetch(fetchUrl, {
      method: action === 'like' ? 'POST' : 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: action === 'like' ? JSON.stringify({ slug }) : undefined,
    });
    if (!response.ok) throw new Error('Like toggle failed');
    return await response.json();
  } catch (error) {
    console.error('Like toggle failed', error);
    return null;
  }
};

const MoviePage = ({ params }) => {
  const { genre, slug } = params;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likedCount, setLikedCount] = useState(0);
  const [isWatched, setIsWatched] = useState(false);
  const [watchCount, setWatchCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const fetchUserRating = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/movie_ratings?slug=${encodeURIComponent(slug)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('User rating fetch failed');
      const data = await response.json();
      setUserRating(Number(data.userRating || 0));
      setAverageRating(Number(data.averageRating || 0));
    } catch (error) {
      console.error('Rating fetch error:', error);
    }
  }, [slug]);

  const handleLike = async () => {
    const action = isLiked ? 'unlike' : 'like';
    const result = await toggleLike(slug, action);
    if (result) {
      setIsLiked(action === 'like');
      setLikedCount(result.likeCount || 0);
    }
  };

  const handleWatchlist = async () => {
    const action = isWatched ? 'remove' : 'add';
    const result = await toggleWatchlist(slug, action);
    if (result) {
      setIsWatched(action === 'add');
      setWatchCount(result.watchCount || 0);
    }
  };

  const handleRatingSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/movie_ratings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ slug, rating: userRating }),
      });
      if (!response.ok) throw new Error('Rating submit failed');
      await fetchUserRating();
    } catch (error) {
      console.error('Submit rating error:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const movieData = await fetchData(genre, slug);
        if (movieData) setData(movieData);

        const loggedIn = await checkUserLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          const likeStatus = await fetchLikeStatus(slug);
          setIsLiked(likeStatus.isLiked);
          setLikedCount(likeStatus.likeCount);

          const watchStatus = await fetchWatchlistStatus(slug);
          setIsWatched(watchStatus.isWatched);
          setWatchCount(watchStatus.watchCount);

          await fetchUserRating();
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load movie');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [genre, slug, fetchUserRating]);

  if (isLoading) return <Spinner animation="border" />;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <Alert variant="warning">Movie not found</Alert>;

  const { film, year, studio, director, screenwriters, producer, run_time, my_rating, review, image_url } = data;

  return (
    <Container>
      <Row>
        <Col xs={12} md={6} className="text-center order-md-2 mt-5 mb-3">
          {image_url ? (
            <Image src={image_url} alt={film} width={300} height={450} />
          ) : (
            <div>No image</div>
          )}
        </Col>
        <Col xs={12} md={6} className="text-center m-auto order-md-1">
          <h1>{film}</h1>
          {isLoggedIn && (
            <>
              <Button variant="link" onClick={handleLike}>
                {isLiked ? <HeartFill color="red" /> : <Heart color="gray" />}
              </Button>
              <Button variant="link" onClick={handleWatchlist}>
                {isWatched ? <TvFill color="green" /> : <Tv color="gray" />}
              </Button>
            </>
          )}
          <h5>Director: {director}</h5>
          <h5>Screenwriters: {screenwriters}</h5>
          <h5>Producer(s): {producer}</h5>
          <h5>Studio: {studio}</h5>
          <h5>Year: {year}</h5>
          <h6>Run Time: {run_time} Minutes</h6>
        </Col>
        <Col xs={12} className="text-center mt-4">
          <h3>Review</h3>
          <p>{review}</p>
          <h4>My Rating: {my_rating} Stars</h4>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          {isLoggedIn && (
            <div className="text-center p-4 border rounded shadow-sm">
              <h2>Rate This Film</h2>
              <input
                type="range"
                min="0"
                max="100"
                value={userRating}
                onChange={(e) => setUserRating(Number(e.target.value))}
                className="form-range mb-3"
              />
              <Button onClick={handleRatingSubmit}>Submit Rating</Button>
              <h5>Average Rating: {averageRating.toFixed(2)}%</h5>
              <h5>Your Rating: {userRating.toFixed(2)}%</h5>
            </div>
          )}
        </Col>
      </Row>

      <Row>
        <Col className="text-center mt-5">
          {isLoggedIn ? (
            <Comments movieSlug={slug} />
          ) : (
            <Alert variant="info">Please log in to like, watch, rate, or comment.</Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default MoviePage;
