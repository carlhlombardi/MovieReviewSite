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
            setIsLiked(data.length > 0); // Assuming if there are any likes, the movie is liked
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
          setIsLiked(true); // Assuming the like was successfully added
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
          body: JSON.stringify({ url, genre }),
        });
        if (response.ok) {
          setIsLiked(false); // Assuming the like was successfully removed
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
