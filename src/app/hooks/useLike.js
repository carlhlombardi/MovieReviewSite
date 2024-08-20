import { useState, useEffect } from 'react';

const useLike = (url, genre) => {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/likes?url=${url}&genre=${genre}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setIsLiked(data.length > 0); // Update state based on whether the movie has any likes
          } else {
            console.error('Failed to fetch like status:', await response.text());
          }
        } catch (error) {
          console.error('Failed to fetch like status:', error);
        }
      }
    };

    if (url && genre) {
      checkLikeStatus();
    }
  }, [url, genre]);

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
          body: JSON.stringify({ url, genre }),
        });
        if (response.ok) {
          setIsLiked(true); // Update state to liked
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
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/likes?url=' + encodeURIComponent(url) + '&genre=' + encodeURIComponent(genre), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          setIsLiked(false); // Update state to not liked
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
