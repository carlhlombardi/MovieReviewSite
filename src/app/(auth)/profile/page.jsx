"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Spinner, Card, Button, ListGroup, Form, Image } from 'react-bootstrap';

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

const fetchLikedMovies = async (baseUrl, token) => {
  try {
    // Step 1: Fetch the list of liked movies' URLs
    const response = await fetch(`${baseUrl}/api/auth/likes`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'An error occurred while fetching liked movies');
    }

    const likedMoviesUrls = await response.json();
    
    // Log liked movie URLs
    console.log('Liked Movies URLs:', likedMoviesUrls);

    // Step 2: Fetch details for each liked movie
    const movieDetailsPromises = likedMoviesUrls.map(async (movie) => {
      const movieResponse = await fetch(`${baseUrl}/api/data/movieDetails?url=${encodeURIComponent(movie.url)}`);
      if (!movieResponse.ok) {
        throw new Error('Failed to fetch movie details');
      }
      return await movieResponse.json();
    });

    const moviesDetails = await Promise.all(movieDetailsPromises);

    // Log detailed movie information
    console.log('Movies Details:', moviesDetails);

    return moviesDetails;
  } catch (err) {
    console.error(err);
    return [];
  }
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [likedMovies, setLikedMovies] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [selectedMovieUrl, setSelectedMovieUrl] = useState('');
  const router = useRouter();
  const baseUrl = 'https://movie-review-site-seven.vercel.app'; // Base URL for API

  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        const token = localStorage.getItem('token');
  
        if (!token) {
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
  
        // Fetch liked movies with detailed information
        const likedMoviesData = await fetchLikedMovies(baseUrl, token);
        setLikedMovies(likedMoviesData);
  
        // Initialize filteredMovies to all movies first
        setFilteredMovies(moviesData);
      } catch (err) {
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
      const response = await fetch(`${baseUrl}/api/auth/comments?id=${encodeURIComponent(commentId)}`, {
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

          <Card className="mb-4">
            <Card.Header as="h5">Your Liked Movies</Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap">
                {likedMovies.length > 0 ? (
                  likedMovies.map((movie) => (
                    <Card key={movie.id} className="m-2" style={{ width: '18rem' }}>
                      <Card.Img variant="top" src={movie.imageUrl} />
                      <Card.Body>
                        <Card.Title>{movie.title}</Card.Title>
                        <Button variant="primary" href={movie.url}>View Details</Button>
                      </Card.Body>
                    </Card>
                  ))
                ) : (
                  <p>You have no liked movies.</p>
                )}
              </div>
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
                      <Button variant="danger" onClick={() => handleDeleteComment(comment.id)}>Delete</Button>
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
