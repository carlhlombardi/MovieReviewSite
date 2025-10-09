"use client";
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Alert, Spinner, Button } from "react-bootstrap";
import Image from "next/image";
import { Heart, HeartFill, Tv, TvFill, Eye, EyeFill } from "react-bootstrap-icons";
import { useAuth } from "@/app/(auth)/contexts/AuthContext";

// 🧭 Fetch movie data from allmovies
const fetchMovieData = async (genre, url) => {
  const res = await fetch(`/api/data/${genre}?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("Failed to fetch movie data");
  return await res.json();
};

// 🧭 Fetch user movie state from new table
const fetchUserMovie = async (username, tmdb_id) => {
  const res = await fetch(
    `/api/user/movies?username=${encodeURIComponent(username)}&tmdb_id=${tmdb_id}`,
    { credentials: "include" }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data[0] || null;
};

// 🪄 Toggle states in user_movies
const updateUserMovie = async (payload) => {
  const res = await fetch(`/api/user/movies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

export default function MoviePage({ params }) {
  const { genre, url } = params;
  const { isLoggedIn, user } = useAuth();

  const [movieData, setMovieData] = useState(null);
  const [userMovieData, setUserMovieData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // 🔁 Load movie and user state
  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const data = await fetchMovieData(genre, url);
        setMovieData(data);

        if (isLoggedIn && user?.username && data.tmdb_id) {
          const userMovie = await fetchUserMovie(user.username, data.tmdb_id);
          setUserMovieData(userMovie);
        } else {
          setUserMovieData(null);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load movie");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [genre, url, isLoggedIn, user?.username]);

  const handleToggle = async (field) => {
    if (!isLoggedIn || !movieData?.tmdb_id) return;

    const newState = {
      username: user.username,
      tmdb_id: movieData.tmdb_id,
      is_liked: field === "is_liked" ? !(userMovieData?.is_liked ?? false) : userMovieData?.is_liked ?? false,
      is_wanted: field === "is_wanted" ? !(userMovieData?.is_wanted ?? false) : userMovieData?.is_wanted ?? false,
      is_seen: field === "is_seen" ? !(userMovieData?.is_seen ?? false) : userMovieData?.is_seen ?? false,
    };

    try {
      await updateUserMovie(newState);
      setUserMovieData(newState);
    } catch (err) {
      console.error(err);
      alert("Failed to update movie state");
    }
  };

  if (isLoading)
    return <Spinner animation="border" role="status" className="d-block mx-auto my-5" />;

  if (error) return <Alert variant="danger" className="my-5">{error}</Alert>;

  if (!movieData) return <Alert variant="warning" className="my-5">Movie not found</Alert>;

  const {
    film,
    year,
    studio,
    director,
    screenwriters,
    producer,
    run_time,
    image_url,
    my_rating,
    review,
    tmdb_id,
  } = movieData;

  const isOwned = userMovieData?.is_liked ?? false;
  const isWanted = userMovieData?.is_wanted ?? false;
  const isSeen = userMovieData?.is_seen ?? false;

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

          {isLoggedIn && (
            <div className="my-3 d-flex flex-wrap gap-2">
              <Button
                variant={isOwned ? "danger" : "outline-danger"}
                onClick={() => handleToggle("is_liked")}
              >
                {isOwned ? <HeartFill /> : <Heart />} Own It
              </Button>

              <Button
                variant={isWanted ? "primary" : "outline-primary"}
                onClick={() => handleToggle("is_wanted")}
              >
                {isWanted ? <TvFill /> : <Tv />} Want It
              </Button>

              <Button
                variant={isSeen ? "success" : "outline-success"}
                onClick={() => handleToggle("is_seen")}
              >
                {isSeen ? <EyeFill /> : <Eye />} Seen It
              </Button>
            </div>
          )}
        </Col>
      </Row>

      <Row>
        <Col>
          {(my_rating || review) && (
            <div className="mt-4">
              {my_rating && (
                <>
                  <h4>Our Rating</h4>
                  <p>{my_rating}</p>
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
    </Container>
  );
}
