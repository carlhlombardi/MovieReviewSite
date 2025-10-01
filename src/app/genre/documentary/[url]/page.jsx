"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import Image from 'next/image';
import Comments from '@/app/components/footer/comments/comments';
import { Heart, HeartFill, Tv, TvFill } from 'react-bootstrap-icons'

// Function to fetch movie data
const fetchData = async (url) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/data/documentarymovies?url=${encodeURIComponent(url)}`);
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

const fetchWatchlistStatus = async (url) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/watchlist?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch watch status');
    }

    const result = await response.json();
    return {
      isWatched: result.iswatched || false,
      watchCount: result.watchcount || 0,
    };
  } catch (error) {
    console.error('Fetch watch status error:', error);
    return { isWatched: false, watchCount: 0 }; // Default values
  }
};

const toggleWatchlist = async (url, action) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Token is missing');
    }

    const fetchUrl = `https://movie-review-site-seven.vercel.app/api/auth/watchlist${action === 'remove' ? `?url=${encodeURIComponent(url)}` : ''}`;
    
    const response = await fetch(fetchUrl, {
      method: action === 'add' ? 'POST' : 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: action === 'add' ? JSON.stringify({ url }) : undefined
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to toggle watchlist');
    }

    return await response.json();
  } catch (error) {
    console.error('Toggle watchlist error:', error);
    return null; // Default error handling
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


// Page component that fetches and displays data
const DocumentaryPage = ({ params }) => {
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

  const handleLike = async () => {
    const action = isLiked ? 'unlike' : 'like';
    try {
      const result = await toggleLike(params.url, action);
      if (result) {
        setIsLiked(action === 'like');
        setLikedCount(result.likeCount || 0);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleWatchlist = async () => {
    const action = isWatched ? 'remove' : 'add';
    try {
      const result = await toggleWatchlist(params.url, action);
      if (result) {
        // Update the UI based on the action
        setIsWatched(action === 'add');
        setWatchCount(result.watchCount || 0); // Ensure the key matches your API response
      } else {
        console.error('No result returned from toggleWatchlist');
      }
    } catch (error) {
      console.error('Failed to toggle watchlist:', error);
    }
  };
  
  
  
  function getMovieSlugFromURL(url) {
    const parts = url.split('/documentary/');
    return parts.length > 1 ? parts[1].split('?')[0] : '';
  }

  const fetchUserRating = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const fullURL = window.location.href;
      const movieSlug = encodeURIComponent(getMovieSlugFromURL(fullURL));

      const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/movie_ratings?url=${movieSlug}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user rating');
      }

      const data = await response.json();
      setUserRating(Number(data.userRating) || 0); // Ensure it's a number
      setAverageRating(Number(data.averageRating) || 0); // Ensure it's a number
    } catch (error) {
      console.error('Error fetching user rating:', error);
    }
  }, []);

  const handleRatingSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const fullURL = window.location.href;
      const movieSlug = getMovieSlugFromURL(fullURL);

      const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/movie_ratings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: movieSlug,
          rating: userRating,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit rating');
      }

      await fetchUserRating();
    } catch (error) {
      console.error('Rating submission error:', error);
    }
  };

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
          const likeStatus = await fetchLikeStatus(params.url);
          setIsLiked(likeStatus.isLiked);
          setLikedCount(likeStatus.likeCount || 0);

          const watchlistStatus = await fetchWatchlistStatus(params.url);
          setIsWatched(watchlistStatus.isWatched);
          setWatchCount(watchlistStatus.watchCount || 0);

          await fetchUserRating(); // Ensure user rating is fetched when user is logged in
        }
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAndStatus();
  }, [params.url, fetchUserRating]);
  

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!data) {
    return <div>No data found</div>;
  }

  const { film, year, studio, director, screenwriters, producer, run_time, my_rating, review, image_url  } = data;

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
          {isLoggedIn && (
            <>
              <Button
                variant="link"
                onClick={handleLike}
                disabled={!isLoggedIn}
                className='mb-4'
              >
                {isLiked ? (
                  <HeartFill color="red" size={18} />
                ) : (
                  <Heart color="grey" size={18} />
                )}
              </Button>
              <Button
                variant="link"
                onClick={handleWatchlist}
                disabled={!isLoggedIn}
                className='mb-4 mr-3'
              >
                {isWatched ? (
                  <TvFill color="green" size={18} />
                ) : (
                  <Tv color="grey" size={18} />
                )}
              </Button>
            </>
          )}
          <h5>Director: {director}</h5>
          <h5>Screenwriter(s): {screenwriters}</h5>
          <h5>Producer(s): {producer}</h5>
          <h5>Studio: {studio}</h5>
          <h5>Year: {year}</h5>
          <h5>Run Time: {run_time} Minutes</h5>
        </Col>
        <Col xs={12} md={6} className="text-center m-auto order-md-4">
          <h3 className='mb-4'>Review of {film}</h3>
          <p>{review}</p>
          <h3>My Rating: {my_rating} Stars</h3>
        </Col>
      </Row>
      <Row>
        <Col>
        <div className="d-flex justify-content-center align-items-center">
      <div className="text-center mt-4 p-4 border rounded shadow-sm" style={{ maxWidth: '500px' }}>
        <h2>Rate This Film</h2>
        <input
          type="range"
          min="0"
          max="100"
          value={userRating}
          onChange={(e) => setUserRating(Number(e.target.value))}
          className="form-range mb-3" // Using Bootstrap's form-range class
        />
        <Button 
          onClick={handleRatingSubmit}
          className='mb-4'
        >
          Submit Rating
        </Button>
        <h5>Average Rating: {averageRating.toFixed(2)}%</h5> {/* Format as fixed-point notation */}
        <h5>Your Rating: {userRating.toFixed(2)}%</h5>
      </div>
    </div>
        </Col>
      </Row>
      <Row>
        <Col xs={12} className="text-center mt-5">
          {isLoggedIn ? (
            <>
              <Comments movieUrl={params.url} />
            </>
          ) : (
            <Alert variant="info">Please log in to like or add to favorites and to view and post comments.</Alert>
          )}
        </Col>
      </Row>
    </Container>
  );
};


export default DocumentaryPage;

