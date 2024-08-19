"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Spinner, Card, Button, ListGroup, Form } from 'react-bootstrap';

// Function to fetch movies from multiple endpoints
const fetchMovies = async () => {
  try {
    const endpoints = [
      'https://movie-review-site-seven.vercel.app/api/data/actionmovies',
      'https://movie-review-site-seven.vercel.app/api/data/classicmovies',
      'https://movie-review-site-seven.vercel.app/api/data/comedymovies',
      'https://movie-review-site-seven.vercel.app/api/data/documentarymovies',
      'https://movie-review-site-seven.vercel.app/api/data/dramamovies',
      'https://movie-review-site-seven.vercel.app/api/data/horrormovies',
      'https://movie-review-site-seven.vercel.app/api/data/scifimovies',
      // Add other endpoints here
    ];

    const responses = await Promise.all(endpoints.map(endpoint => fetch(endpoint)));
    const moviesArrays = await Promise.all(responses.map(response => response.json()));
    const movies = moviesArrays.flat(); // Combine arrays into a single array

    return movies;
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
};

// Function to fetch comments for a movie
const fetchComments = async (selectedMovieUrl, token) => {
  try {
    if (!selectedMovieUrl) return [];

    const commentsResponse = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?url=${encodeURIComponent(selectedMovieUrl)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!commentsResponse.ok) {
      const errorData = await commentsResponse.json();
      throw new Error(errorData.message || 'An error occurred while fetching comments');
    }

    return await commentsResponse.json();
  } catch (err) {
    console.error(err);
    return [];
  }
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedMovieUrl, setSelectedMovieUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    const fetchProfileAndMovies = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user profile
        const profileResponse = await fetch('https://movie-review-site-seven.vercel.app/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          setError(errorData.message || 'An error occurred');
          router.push('/login');
          return;
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);

        // Fetch movies from multiple endpoints
        const moviesData = await fetchMovies();
        setMovies(moviesData);

        // Initialize filteredMovies to all movies first
        setFilteredMovies(moviesData);
      } catch (err) {
        setError('An error occurred');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndMovies();
  }, [router]);

  useEffect(() => {
    const fetchFilteredMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Fetch comments for each movie and filter movies with comments
        const moviesWithComments = await Promise.all(movies.map(async (movie) => {
          const commentsData = await fetchComments(movie.url, token);
          return { ...movie, hasComments: commentsData.length > 0 };
        }));

        // Filter movies that have comments
        setFilteredMovies(moviesWithComments.filter(movie => movie.hasComments));
      } catch (err) {
        setError('An error occurred while fetching comments');
      }
    };

    fetchFilteredMovies();
  }, [movies]);

  useEffect(() => {
    const fetchCommentsForSelectedMovie = async () => {
      if (!selectedMovieUrl) return;

      try {
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        const commentsData = await fetchComments(selectedMovieUrl, token);
        setComments(commentsData);
      } catch (err) {
        setError('An error occurred while fetching comments');
      }
    };

    fetchCommentsForSelectedMovie();
  }, [selectedMovieUrl, router]);

  // Function to format the date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?id=${encodeURIComponent(commentId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'An error occurred while deleting the comment');
        return;
      }

      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (err) {
      setError('An error occurred while deleting the comment');
    }
  };

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <h2>Loading your profile...</h2>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2>Welcome back, {profile?.firstname}!</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {profile && (
        <>
          <Card className="mb-4">
            <Card.Header as="h5">Profile Details</Card.Header>
            <Card.Body>
              <Card.Text>
                <strong>Name:</strong> {profile.firstname} {profile.lastname}
              </Card.Text>
              <Card.Text>
                <strong>User Name:</strong> {profile.username}
              </Card.Text>
              <Card.Text>
                <strong>Email:</strong> {profile.email}
              </Card.Text>
              <Card.Text>
                <strong>Date Joined:</strong> {formatDate(profile.date_joined)}
              </Card.Text>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header as="h5">Select Movie to View Comments</Card.Header>
            <Card.Body>
              <Form.Control
                as="select"
                value={selectedMovieUrl}
                onChange={(e) => setSelectedMovieUrl(e.target.value)}
              >
                <option value="">Select a movie</option>
                {filteredMovies.map((movie) => (
                  <option key={movie.url} value={movie.url}>{movie.film}</option>
                ))}
              </Form.Control>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header as="h5">Your Comments</Card.Header>
            <Card.Body>
              <ListGroup>
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <ListGroup.Item key={comment.id}>
                      <div>{comment.text}</div>
                      <div>{comment.createdat}</div>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item>No comments found.</ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}
