'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Container, Row, Col, Alert, Spinner, Button } from 'react-bootstrap';
import Image from 'next/image';
import { Heart, HeartFill, Tv, TvFill } from 'react-bootstrap-icons';

// === Helper Functions ===
const slugifyGenre = (genre) =>
  genre.toString().toLowerCase().replace(/[^a-z0-9]+/g, '').trim();

const fetchData = async (genre, url) => {
  const genreSlug = slugifyGenre(genre);
  const genreTable = `${genreSlug}movies`;
  const res = await fetch(`/api/data/${genreTable}?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error('Failed to fetch movie data');
  return await res.json();
};

const getCurrentUser = async () => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  const res = await fetch('/api/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return await res.json(); // { username: '...' }
};

// === toggle helpers ===
export const toggleOwnIt = async (username, movieData, action) => {
  const token = localStorage.getItem('token');
  const endpoint = `/api/auth/profile/${username}/mycollection`;

  const payload =
    action === 'like'
      ? {
          username,
          url: movieData.url,
          isliked: movieData.isliked ?? true,
          likedcount: movieData.likedcount ?? 0,
          title: movieData.title,
          genre: movieData.genre,
          image_url: movieData.image_url,
        }
      : { url: movieData.url };

  const res = await fetch(endpoint, {
    method: action === 'like' ? 'POST' : 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errMsg = await res.text();
    throw new Error(`Own It toggle failed: ${errMsg}`);
  }
  return await res.json();
};

export const toggleWantIt = async (username, movieData, action) => {
  const token = localStorage.getItem('token');
  const endpoint = `/api/auth/profile/${username}/wantedforcollection`;

  const payload =
    action === 'add'
      ? {
          username,
          url: movieData.url,
          title: movieData.title,              // ✅ added
          genre: movieData.genre,
          iswatched: movieData.iswatched ?? true,
          watchcount: movieData.watchcount ?? 0,
          image_url: movieData.image_url,
        }
      : { url: movieData.url };

  const res = await fetch(endpoint, {
    method: action === 'add' ? 'POST' : 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errMsg = await res.text();
    throw new Error(`Want It toggle failed: ${errMsg}`);
  }
  return await res.json();
};



export default function MoviePage({ params }) {
  const { genre, url } = params;
  const slugifiedUrl = url;

  const [username, setUsername] = useState(null);
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOwned, setIsOwned] = useState(false);
  const [isWanted, setIsWanted] = useState(false);

  const fetchUserRating = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(
        `/api/auth/movie_ratings?url=${encodeURIComponent(slugifiedUrl)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('User rating fetch failed');
      const ratingData = await res.json();
      // optional: store ratingData if needed
    } catch (err) {
      console.error('Rating fetch error:', err);
    }
  }, [slugifiedUrl]);

  const handleOwnIt = async () => {
    const action = isOwned ? 'unlike' : 'like';
    const result = await toggleOwnIt(username, data, action);
    if (result) setIsOwned(action === 'like');
  };

  const handleWantIt = async () => {
    const action = isWanted ? 'remove' : 'add';
    const result = await toggleWantIt(username, data, action);
    if (result) setIsWanted(action === 'add');
  };

  useEffect(() => {
    const init = async () => {
      try {
        setIsLoading(true);
        const movieData = await fetchData(genre, slugifiedUrl);
        setData(movieData);

        const user = await getCurrentUser();
        if (user && user.username) {
          setIsLoggedIn(true);
          setUsername(user.username);

          const token = localStorage.getItem('token');

          // check if movie is in mycollection
          const ownRes = await fetch(
            `/api/auth/profile/${user.username}/mycollection`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const ownJson = ownRes.ok ? await ownRes.json() : { movies: [] };
          setIsOwned(
            ownJson.movies?.some((m) => m.url === slugifiedUrl) ?? false
          );

          // check if movie is in wantedforcollection
          const wantRes = await fetch(
            `/api/auth/profile/${user.username}/wantedformycollection`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const wantJson = wantRes.ok ? await wantRes.json() : { movies: [] };
          setIsWanted(
            wantJson.movies?.some((m) => m.url === slugifiedUrl) ?? false
          );

          await fetchUserRating();
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Failed to load movie');
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [genre, slugifiedUrl, fetchUserRating]);

  if (isLoading)
    return (
      <Spinner
        animation="border"
        role="status"
        className="d-block mx-auto my-5"
      />
    );
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
            <div className="my-3">
              <Button
                variant={isOwned ? 'danger' : 'outline-danger'}
                onClick={handleOwnIt}
                className="me-2"
              >
                {isOwned ? <HeartFill /> : <Heart />} Own It
              </Button>

              <Button
                variant={isWanted ? 'primary' : 'outline-primary'}
                onClick={handleWantIt}
              >
                {isWanted ? <TvFill /> : <Tv />} Want It
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
