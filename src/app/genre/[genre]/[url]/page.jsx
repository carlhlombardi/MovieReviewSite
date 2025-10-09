"use client";
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Alert, Spinner, Button } from "react-bootstrap";
import Image from "next/image";
import { Heart, HeartFill, Tv, TvFill, Eye, EyeFill } from "react-bootstrap-icons";
import { useAuth } from "@/app/(auth)/contexts/AuthContext";

// === Helper Functions ===
const slugifyGenre = (genre) =>
  genre.toString().toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

const fetchData = async (genre, url) => {
  const res = await fetch(`/api/data/${genre}?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error("Failed to fetch movie data");
  return await res.json();
};

// === toggle helpers ===
export const toggleOwnIt = async (username, movieData, action) => {
  const endpoint = `/api/auth/profile/${username}/mycollection`;
  const payload =
    action === "like"
      ? {
          username,
          url: movieData.url,
          isliked: true,
          likedcount: movieData.likedcount ?? 0,
          title: movieData.title ?? movieData.film,
          genre: movieData.genre,
          image_url: movieData.image_url,
        }
      : { url: movieData.url };
  const res = await fetch(endpoint, {
    method: action === "like" ? "POST" : "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

export const toggleWantIt = async (username, movieData, action) => {
  const endpoint = `/api/auth/profile/${username}/wantedforcollection`;
  const payload =
    action === "add"
      ? {
          username,
          url: movieData.url,
          title: movieData.title ?? movieData.film,
          genre: movieData.genre,
          iswatched: true,
          watchcount: movieData.watchcount ?? 0,
          image_url: movieData.image_url,
        }
      : { url: movieData.url };
  const res = await fetch(endpoint, {
    method: action === "add" ? "POST" : "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

// ✅ NEW: toggle seen it
export const toggleSeenIt = async (username, movieData, action) => {
  const endpoint = `/api/auth/profile/${username}/seenit`;
  const payload =
    action === "seen"
      ? {
          username,
          url: movieData.url,
          title: movieData.title ?? movieData.film,
          genre: movieData.genre,
          seenit: true,
          image_url: movieData.image_url,
        }
      : { url: movieData.url };
  const res = await fetch(endpoint, {
    method: action === "seen" ? "POST" : "DELETE",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
};

export default function MoviePage({ params }) {
  const { genre, url } = params;
  const slugifiedUrl = url;
  const { isLoggedIn, user } = useAuth();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isOwned, setIsOwned] = useState(false);
  const [isWanted, setIsWanted] = useState(false);
  const [isSeen, setIsSeen] = useState(false); // ✅ new state

  const handleOwnIt = async () => {
    const action = isOwned ? "unlike" : "like";
    const result = await toggleOwnIt(user.username, data, action);
    if (result) setIsOwned(action === "like");
  };

  const handleWantIt = async () => {
    const action = isWanted ? "remove" : "add";
    const result = await toggleWantIt(user.username, data, action);
    if (result) setIsWanted(action === "add");
  };

  const handleSeenIt = async () => {
    const action = isSeen ? "remove" : "seen";
    const result = await toggleSeenIt(user.username, data, action);
    if (result) setIsSeen(action === "seen");
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const movieData = await fetchData(genre, slugifiedUrl);
        setData(movieData);

        if (isLoggedIn && user?.username) {
          // mycollection
          const ownRes = await fetch(
            `/api/auth/profile/${user.username}/mycollection`,
            { credentials: "include" }
          );
          const ownJson = ownRes.ok ? await ownRes.json() : { movies: [] };
          setIsOwned(ownJson.movies?.some((m) => m.url === slugifiedUrl) ?? false);

          // wantedforcollection
          const wantRes = await fetch(
            `/api/auth/profile/${user.username}/wantedforcollection`,
            { credentials: "include" }
          );
          const wantJson = wantRes.ok ? await wantRes.json() : { movies: [] };
          setIsWanted(wantJson.movies?.some((m) => m.url === slugifiedUrl) ?? false);

          // ✅ seenit
          const seenRes = await fetch(
            `/api/auth/profile/${user.username}/seenit`,
            { credentials: "include" }
          );
          const seenJson = seenRes.ok ? await seenRes.json() : { movies: [] };
          setIsSeen(seenJson.movies?.some((m) => m.url === slugifiedUrl) ?? false);
        } else {
          setIsOwned(false);
          setIsWanted(false);
          setIsSeen(false);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to load movie");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [genre, slugifiedUrl, isLoggedIn, user?.username]);

  if (isLoading)
    return <Spinner animation="border" role="status" className="d-block mx-auto my-5" />;
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
    image_url,
    my_rating,
    review,
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

          {isLoggedIn && (
            <div className="my-3 d-flex flex-wrap gap-2">
              <Button
                variant={isOwned ? "danger" : "outline-danger"}
                onClick={handleOwnIt}
              >
                {isOwned ? <HeartFill /> : <Heart />} Own It
              </Button>

              <Button
                variant={isWanted ? "primary" : "outline-primary"}
                onClick={handleWantIt}
              >
                {isWanted ? <TvFill /> : <Tv />} Want It
              </Button>

              {/* ✅ New Seen It Button */}
              <Button
                variant={isSeen ? "success" : "outline-success"}
                onClick={handleSeenIt}
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
