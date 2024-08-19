import { useState, useEffect } from 'react';

const useLike = (movieId, genre) => {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/likes?movieId=${movieId}&genre=${genre}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setIsLiked(data.liked || false); // Default to false if `liked` is not present
          } else {
            console.error('Failed to fetch like status:', await response.text());
          }
        } catch (error) {
          console.error('Failed to fetch like status:', error);
        }
      }
    };

    if (movieId && genre) {
      checkLikeStatus();
    }
  }, [movieId, genre]);

  const likeMovie = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ movieId, genre }),
        });
        if (response.ok) {
          const data = await response.json();
          setIsLiked(data.liked || false); // Default to false if `liked` is not present
        } else {
          console.error('Failed to like movie:', await response.text());
        }
      } catch (error) {
        console.error('Failed to like movie:', error);
      }
    }
  };

  const unlikeMovie = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/likes', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ movieId, genre }),
        });
        if (response.ok) {
          const data = await response.json();
          setIsLiked(!(data.liked || false)); // Default to false if `liked` is not present
        } else {
          console.error('Failed to unlike movie:', await response.text());
        }
      } catch (error) {
        console.error('Failed to unlike movie:', error);
      }
    }
  };

  return {
    isLiked,
    likeMovie,
    unlikeMovie,
  };
};

export default useLike;
