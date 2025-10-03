"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Alert, Spinner, Button } from "react-bootstrap";
import Image from "next/image";
import Comments from "@/app/components/footer/comments/comments";
import { Heart, HeartFill, Tv, TvFill } from "react-bootstrap-icons";

// === Helper Functions ===

// Slugify genre for table name: e.g., "Science Fiction" → "sciencefiction"
const slugifyGenre = (genre) => {
  return genre.toString().toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
};

// Slugify movie title + tmdb_id: e.g., "Inception", 12345 → "inception-12345"
const slugify = (title, tmdb_id) => {
  return `${title}-${tmdb_id}`
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Fetch movie data from backend
const fetchData = async (genre, url) => {
  const genreSlug = slugifyGenre(genre);
  const genreTable = `${genreSlug}movies`;

  try {
    const response = await fetch(
      `https://movie-review-site-seven.vercel.app/api/data/${genreTable}?url=${encodeURIComponent(url)}`
    );
    if (!response.ok) throw new Error("Failed to fetch movie data");
    return await response.json();
  } catch (error) {
    console.error("Fetch data error:", error);
    return null;
  }
};

// Check if user is logged in
const checkUserLoggedIn = async () => {
  try {
    if (typeof window === "undefined") return false; // SSR safety
    const token = localStorage.getItem("token");
    if (!token) return false;

    const response = await fetch("https://movie-review-site-seven.vercel.app/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch (error) {
    console.error("Login check failed", error);
    return false;
  }
};

// Fetch like status for movie
const fetchLikeStatus = async (url) => {
  try {
    if (typeof window === "undefined") return { isLiked: false, likeCount: 0 };
    const token = localStorage.getItem("token");
    const response = await fetch(
      `https://movie-review-site-seven.vercel.app/api/auth/likes?url=${encodeURIComponent(url)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Like status fetch failed");
    const data = await response.json();
    return {
      isLiked: data.isliked || false,
      likeCount: data.likecount || 0,
    };
  } catch (error) {
    console.error("Fetch like error:", error);
    return { isLiked: false, likeCount: 0 };
  }
};

// Fetch watchlist status for movie
const fetchWatchlistStatus = async (url) => {
  try {
    if (typeof window === "undefined") return { isWatched: false, watchCount: 0 };
    const token = localStorage.getItem("token");
    const response = await fetch(
      `https://movie-review-site-seven.vercel.app/api/auth/watchlist?url=${encodeURIComponent(url)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Watchlist status fetch failed");
    const data = await response.json();
    return {
      isWatched: data.iswatched || false,
      watchCount: data.watchcount || 0,
    };
  } catch (error) {
    console.error("Fetch watch error:", error);
    return { isWatched: false, watchCount: 0 };
  }
};

// Toggle watchlist status
const toggleWatchlist = async (url, action) => {
  try {
    if (typeof window === "undefined") throw new Error("Window object is undefined");
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token missing");

    const fetchUrl = `https://movie-review-site-seven.vercel.app/api/auth/watchlist${
      action === "remove" ? `?url=${encodeURIComponent(url)}` : ""
    }`;

    const response = await fetch(fetchUrl, {
      method: action === "add" ? "POST" : "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: action === "add" ? JSON.stringify({ url }) : undefined,
    });

    if (!response.ok) throw new Error("Failed to toggle watchlist");
    return await response.json();
  } catch (error) {
    console.error("Watchlist toggle failed", error);
    return null;
  }
};

// Toggle like status
const toggleLike = async (url, action) => {
  try {
    if (typeof window === "undefined") throw new Error("Window object is undefined");
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Token missing");

    const fetchUrl = `https://movie-review-site-seven.vercel.app/api/auth/likes${
      action === "unlike" ? `?url=${encodeURIComponent(url)}` : ""
    }`;

    const response = await fetch(fetchUrl, {
      method: action === "like" ? "POST" : "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: action === "like" ? JSON.stringify({ url }) : undefined,
    });

    if (!response.ok) throw new Error("Like toggle failed");
    return await response.json();
  } catch (error) {
    console.error("Like toggle failed", error);
    return null;
  }
};

const MoviePage = ({ params }) => {
  const { genre, url } = params;

  // Use the url param directly as slugified URL (already slugified)
  const slugifiedUrl = url;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likedCount, setLikedCount] = useState(0);
  const [isWatched, setIsWatched] = useState(false);
  const [watchCount, setWatchCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  // Fetch user rating and average rating
  const fetchUserRating = useCallback(async () => {
    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `https://movie-review-site-seven.vercel.app/api/auth/movie_ratings?url=${encodeURIComponent(slugifiedUrl)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) throw new Error("User rating fetch failed");

      const ratingData = await response.json();
      setUserRating(Number(ratingData.userRating || 0));
      setAverageRating(Number(ratingData.averageRating || 0));
    } catch (error) {
      console.error("Rating fetch error:", error);
    }
  }, [slugifiedUrl]);

  // Handle like button click
  const handleLike = async () => {
    const action = isLiked ? "unlike" : "like";
    const result = await toggleLike(slugifiedUrl, action);
    if (result) {
      setIsLiked(action === "like");
      setLikedCount(result.likeCount || 0);
    }
  };

  // Handle watchlist button click
  const handleWatchlist = async () => {
    const action = isWatched ? "remove" : "add";
    const result = await toggleWatchlist(slugifiedUrl, action);
    if (result) {
      setIsWatched(action === "add");
      setWatchCount(result.watchCount || 0);
    }
  };

  // Submit user rating
  const handleRatingSubmit = async () => {
    try {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("token");
      if (!token) throw new Error("User not logged in");

      const response = await fetch(
        "https://movie-review-site-seven.vercel.app/api/auth/movie_ratings",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: slugifiedUrl, rating: userRating }),
        }
      );

      if (!response.ok) throw new Error("Rating submit failed");
      await fetchUserRating();
    } catch (error) {
      console.error("Submit rating error:", error);
    }
  };

  // Initial data fetching
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);

        // Fetch movie data
        const movieData = await fetchData(genre, slugifiedUrl);
        if (!movieData) throw new Error("Movie not found");
        setData(movieData);

        // Check login status
        const loggedIn = await checkUserLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          // Fetch like status
          const likeStatus = await fetchLikeStatus(slugifiedUrl);
          setIsLiked(likeStatus.isLiked);
          setLikedCount(likeStatus.likeCount);

          // Fetch watchlist status
          const watchStatus = await fetchWatchlistStatus(slugifiedUrl);
          setIsWatched(watchStatus.isWatched);
          setWatchCount(watchStatus.watchCount);

          // Fetch ratings
          await fetchUserRating();
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load movie");
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [genre, slugifiedUrl, fetchUserRating]);

  if (isLoading) return <Spinner animation="border" role="status" className="d-block mx-auto my-5" />;
  if (error) return <Alert variant="danger" className="my-5">{error}</Alert>;
  if (!data) return <Alert variant="warning" className="my-5">Movie not found</Alert>;

  const {
    film,
    year,
    studio,
    director,
    screenwriters,
    producer,
    run_time,
    my_rating,
    review,
    image_url,
  } = data;

  return (
    <Container className="my-5">
      <Row>
        <Col xs={12} md={6} className="text-center order-md-2 mb-3">
          {image_url ? (
            <Image src={image_url} alt={film} width={300} height={450} />
          ) : (
            <div>No image available</div>
          )}
        </Col>
        <Col xs={12} md={6} className="order-md-1">
          <h1>{film} ({year})</h1>
          <p><strong>Studio:</strong> {studio}</p>
          <p><strong>Director:</strong> {director}</p>
          <p><strong>Screenwriters:</strong> {screenwriters}</p>
          <p><strong>Producer:</strong> {producer}</p>
          <p><strong>Runtime:</strong> {run_time} minutes</p>

          <div className="my-3">
            <Button variant={isLiked ? "danger" : "outline-danger"} onClick={handleLike} className="me-2">
              {isLiked ? <HeartFill /> : <Heart />} {likedCount}
            </Button>

            <Button variant={isWatched ? "primary" : "outline-primary"} onClick={handleWatchlist}>
              {isWatched ? <TvFill /> : <Tv />} {watchCount}
            </Button>
          </div>

          {isLoggedIn && (
            <div className="my-3">
              <label htmlFor="ratingInput" className="form-label">Your Rating (1-5):</label>
              <input
                id="ratingInput"
                type="number"
                min={1}
                max={5}
                value={userRating}
                onChange={(e) => setUserRating(Number(e.target.value))}
                className="form-control mb-2"
              />
              <Button onClick={handleRatingSubmit} disabled={userRating < 1 || userRating > 5}>
                Submit Rating
              </Button>
              <p className="mt-2">Average Rating: {averageRating.toFixed(2)}</p>
            </div>
          )}

          {review && (
            <div className="mt-4">
              <h4>Review:</h4>
              <p>{review}</p>
            </div>
          )}
        </Col>
      </Row>

      <Row>
        <Col xs={12} className="mt-5">
          <Comments genre={genre} url={slugifiedUrl} />
        </Col>
      </Row>
    </Container>
  );
};

export default MoviePage;
