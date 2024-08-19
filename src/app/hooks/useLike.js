import { useState, useEffect } from 'react';

const useLike = (slug, genre) => {
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const checkLikeStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`https://movie-review-site-seven.vercel.app/api/likes?id=${slug}&genre=${genre}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setIsLiked(data.length > 0); // Set `isLiked` based on the response
          } else {
            console.error('Failed to fetch like status:', await response.text());
          }
        } catch (error) {
          console.error('Failed to fetch like status:', error);
        }
      }
    };

    if (slug && genre) {
      checkLikeStatus();
    }
  }, [slug, genre]);

  const likeMovie = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/likes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slug, genre }),
        });
        if (response.ok) {
          const data = await response.json();
          setIsLiked(true); // Set `isLiked` to true
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
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/likes', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ slug, genre }),
        });
        if (response.ok) {
          const data = await response.json();
          setIsLiked(false); // Set `isLiked` to false
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
