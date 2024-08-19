"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Spinner, Card, ListGroup, Form } from 'react-bootstrap';

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

const fetchLikedStatus = async (movieUrl, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/likes?url=${encodeURIComponent(movieUrl)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'An error occurred while fetching liked status');
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching liked status:', err);
    return { liked: 'no' }; // Default to 'no' if there's an error
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
  const [likedMovies, setLikedMovies] = useState([]);
  const router = useRouter();
  const baseUrl = 'https://movie-review-site-seven.vercel.app'; // Base URL for API

  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          console.log('No token found, redirecting to login');
          router.push('/login');
          return;
        }

        // Fetch user profile
        const profileResponse = await fetch(`${baseUrl}/api/auth/profile`, {
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

// Fetch liked status for each movie
const likedMoviesData = await Promise.all(moviesData.map(movie => fetchLikedStatus(movie.url, token)));

// Filter movies based on liked status
const likedMovieUrls = new Set(likedMoviesData.filter(status => status.liked === 'yes').map((_, index) => moviesData[index].url));
const filteredLikedMovies = moviesData.filter(movie => likedMovieUrls.has(movie.url));
setLikedMovies(filteredLikedMovies)

        // Initialize filteredMovies to all movies first
        setFilteredMovies(moviesData);
      } catch (err) {
        console.error('Error in fetchDataAsync:', err);
        setError('An error occurred');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAsync();
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
        console.error('Error in fetchFilteredMovies:', err);
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
          console.log('No token found, redirecting to login');
          router.push('/login');
          return;
        }

        const commentsData = await fetchComments(selectedMovieUrl, token);
        setComments(commentsData);
      } catch (err) {
        console.error('Error in fetchCommentsForSelectedMovie:', err);
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
            <Card.Header as="h5">Your Liked Movies</Card.Header>
            <Card.Body>
              {likedMovies.length > 0 ? (
                <ListGroup>
                  {likedMovies.map((movie) => (
                    <ListGroup.Item key={movie.url}>
                      <strong>{movie.film}</strong>
                      <p>{movie.description}</p>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p>You have not liked any movies yet.</p>
              )}
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
            <Card.Header as="h5">Comments</Card.Header>
            <Card.Body>
              {comments.length > 0 ? (
                <ListGroup>
                  {comments.map((comment) => (
                    <ListGroup.Item key={comment.id}>
                      <p><strong>{comment.username}:</strong> {comment.text}</p>
                      <p><small>{formatDate(comment.date)}</small></p>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p>No comments for this movie.</p>
              )}
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}
