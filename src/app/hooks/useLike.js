import { useState } from 'react';

const useLike = (movieId, genre) => {
  const [isLiked, setIsLiked] = useState(false);

  const checkLikeStatus = async (token) => {
    try {
      const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/likes?movieId=${id}&genre=${genre}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      setIsLiked(data.liked);
    } catch (error) {
      console.error('Failed to fetch like status', error);
    }
  };

  const likeMovie = async (token) => {
    try {
      const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/likes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId, genre }),
      });
      const data = await response.json();
      if (data.liked) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Failed to like movie', error);
    }
  };

  const unlikeMovie = async (token) => {
    try {
      const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/likes', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId, genre }),
      });
      const data = await response.json();
      if (!data.liked) {
        setIsLiked(false);
      }
    } catch (error) {
      console.error('Failed to unlike movie', error);
    }
  };

  return {
    isLiked,
    checkLikeStatus,
    likeMovie,
    unlikeMovie,
  };
};

export default useLike;
