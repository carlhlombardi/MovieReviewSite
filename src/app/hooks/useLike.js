import { useState, useEffect } from 'react';

const useLike = (movieUrl, genre) => {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/likes?movieUrl=${movieUrl}&genre=${genre}`, {
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

    if (movieUrl && genre) {
      checkLikeStatus();
    }
  }, [movieUrl, genre]);

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
          body: JSON.stringify({ movieUrl, genre }),
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
          body: JSON.stringify({ movieUrl, genre }),
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
