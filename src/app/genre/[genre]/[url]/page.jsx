"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Alert, Spinner, Button } from "react-bootstrap";
import Image from "next/image";
import Comments from "@/app/components/footer/comments/comments";
import { Heart, HeartFill, Tv, TvFill } from "react-bootstrap-icons";

// === Helper Functions ===
const slugifyGenre = (genre) =>
  genre.toString().toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

const fetchData = async (genre, url) => {
  const genreSlug = slugifyGenre(genre);
  const genreTable = `${genreSlug}movies`;

  try {
    const response = await fetch(
      `https://movie-review-site-seven.vercel.app/api/data/${genreTable}?url=${encodeURIComponent(
        url
      )}`
    );
    if (!response.ok) throw new Error("Failed to fetch movie data");
    return await response.json();
  } catch (error) {
    console.error("Fetch data error:", error);
    return null;
  }
};

const checkUserLoggedIn = async () => {
  try {
    if (typeof window === "undefined") return false;
    const token = localStorage.getItem("token");
    if (!token) return false;

    const response = await fetch(
      "https://movie-review-site-seven.vercel.app/api/auth/me",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return response.ok;
  } catch (error) {
    console.error("Login check failed", error);
    return false;
  }
};

// === Own/Want helpers ===
const fetchOwnStatus = async (url) => {
  try {
    if (typeof window === "undefined") return { isLiked: false, likeCount: 0 };
    const token = localStorage.getItem("token");
    const response = await fetch(
      `https://movie-review-site-seven.vercel.app/api/auth/mycollection?url=${encodeURIComponent(
        url
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error("Own It status fetch failed");
    const data = await response.json();
    return {
      isLiked: data.isliked || false,
      likeCount: data.likecount || 0,
    };
  } catch (error) {
    console.error("Fetch own-it error:", error);
    return { isLiked: false, likeCount: 0 };
  }
};

const fetchWantStatus = async (url) => {
  try {
    if (typeof window === "undefined")
      return { isWatched: false, watchCount: 0 };
    const token = localStorage.getItem("token");
    const response = await fetch(
      `https://movie-review-site-seven.vercel.app/api/auth/wantedforcollection?url=${encodeURIComponent(
        url
      )}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error("Want It status fetch failed");
    const data = await response.json();
    return {
      isWatched: data.iswatched || false,
      watchCount: data.watchcount || 0,
    };
  } catch (error) {
    console.error("Fetch want-it error:", error);
    return { isWatched: false, watchCount: 0 };
  }
};

const toggleOwnIt = async (url, action) => {
  try {
    const token = localStorage.getItem("token");
    const fetchUrl = `https://movie-review-site-seven.vercel.app/api/auth/mycollection${
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
    if (!response.ok) throw new Error("Own It toggle failed");
    return await response.json();
  } catch (error) {
    console.error("Own It toggle failed", error);
    return null;
  }
};

const toggleWantIt = async (url, action) => {
  try {
    const token = localStorage.getItem("token");
    const fetchUrl = `https://movie-review-site-seven.vercel.app/api/auth/wantedforcollection${
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
    if (!response.ok) throw new Error("Want It toggle failed");
    return await response.json();
  } catch (error) {
    console.error("Want It toggle failed", error);
    return null;
  }
};

const MoviePage = ({ params }) => {
  const { genre, url } = params;
  const slugifiedUrl = url;

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [isOwned, setIsOwned] = useState(false);
  const [isWanted, setIsWanted] = useState(false);

  const [userRating, setUserRating] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  const fetchUserRating = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `https://movie-review-site-seven.vercel.app/api/auth/movie_ratings?url=${encodeURIComponent(
          slugifiedUrl
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error("User rating fetch failed");
      const ratingData = await response.json();
      setUserRating(Number(ratingData.userRating || 0));
      setAverageRating(Number(ratingData.averageRating || 0));
    } catch (error) {
      console.error("Rating fetch error:", error);
    }
  }, [slugifiedUrl]);

  const handleOwnIt = async () => {
    const action = isOwned ? "unlike" : "like";
    const result = await toggleOwnIt(slugifiedUrl, action);
    if (result) setIsOwned(action === "like");
  };

  const handleWantIt = async () => {
    const action = isWanted ? "remove" : "add";
    const result = await toggleWantIt(slugifiedUrl, action);
    if (result) setIsWanted(action === "add");
  };

  const handleRatingSubmit = async () => {
    try {
      const token = localStorage.getItem("token");
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

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);

        const movieData = await fetchData(genre, slugifiedUrl);
        console.log("🎯 movieData response:", movieData); // 👈 console log
        if (!movieData) throw new Error("Movie not found");
        setData(movieData);

        const loggedIn = await checkUserLoggedIn();
        setIsLoggedIn(loggedIn);

        if (loggedIn) {
          const ownStatus = await fetchOwnStatus(slugifiedUrl);
          setIsOwned(ownStatus.isLiked);
          const wantStatus = await fetchWantStatus(slugifiedUrl);
          setIsWanted(wantStatus.isWatched);
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

  if (isLoading)
    return (
      <Spinner animation="border" role="status" className="d-block mx-auto my-5" />
    );
  if (error) return <Alert variant="danger" className="my-5">{error}</Alert>;
  if (!data) return <Alert variant="warning" className="my-5">Movie not found</Alert>;

  // ✅ flexible rating/review extraction
  const myRating =
    data.my_rating ?? data.myrating ?? data.myRating ?? null;
  const review = data.review ?? data.Review ?? null;

  const {
    film,
    year,
    studio,
    director,
    screenwriters,
    producer,
    run_time,
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
          <h2 className="text-center">
            {film} {year && `(${year})`}
          </h2>
          {studio && <p><strong>Studio:</strong> {studio}</p>}
          {director && <p><strong>Director:</strong> {director}</p>}
          {screenwriters && <p><strong>Screenwriters:</strong> {screenwriters}</p>}
          {producer && <p><strong>Producer:</strong> {producer}</p>}
          {run_time && <p><strong>Runtime:</strong> {run_time} minutes</p>}

          <div className="my-3">
            <Button
              variant={isOwned ? "danger" : "outline-danger"}
              onClick={handleOwnIt}
              className="me-2"
            >
              {isOwned ? <HeartFill /> : <Heart />} Own It
            </Button>

            <Button
              variant={isWanted ? "primary" : "outline-primary"}
              onClick={handleWantIt}
            >
              {isWanted ? <TvFill /> : <Tv />} Want It
            </Button>
          </div>

          {isLoggedIn && (
            <div className="my-3">
              <label htmlFor="ratingInput" className="form-label">
                Your Rating (1-5):
              </label>
              <input
                id="ratingInput"
                type="number"
                min={1}
                max={5}
                value={userRating}
                onChange={(e) => setUserRating(Number(e.target.value))}
                className="form-control mb-2"
              />
              <Button
                onClick={handleRatingSubmit}
                disabled={userRating < 1 || userRating > 5}
              >
                Submit Rating
              </Button>
              {averageRating > 0 && (
                <p className="mt-2">Average Rating: {averageRating.toFixed(2)}</p>
              )}
            </div>
          )}

          {(myRating || review) && (
            <div className="mt-4">
              {myRating && (
                <>
                  <h4>Our Rating</h4>
                  <p>{myRating}</p>
                </>
              )}
              {review && (
                <>
                  <h4>Review:</h4>
                  <p>{review}</p>
                </>
              )}
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
