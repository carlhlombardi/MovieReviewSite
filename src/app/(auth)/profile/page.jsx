"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Spinner, Card, Form, ListGroup } from 'react-bootstrap';
import Comments from '@/app/components/comments/comments.jsx';

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
    ];

    const responses = await Promise.all(endpoints.map(endpoint => fetch(endpoint)));
    const moviesArrays = await Promise.all(responses.map(response => response.json()));
    return moviesArrays.flat(); // Combine arrays into a single array
  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
};

// Function to fetch liked movies for the authenticated user
const fetchLikedMovies = async (token) => {
  try {
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/likes', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch liked movies');
    }
    return await response.json(); // Assuming this returns a list of liked movie URLs
  } catch (error) {
    console.error('Error fetching liked movies:', error);
    return [];
  }
};

const fetchComments = async (movieUrl, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?url=${encodeURIComponent(movieUrl)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [likedMovies, setLikedMovies] = useState([]);
  const [selectedMovieUrl, setSelectedMovieUrl] = useState('');
  const [movieComments, setMovieComments] = useState([]);
  const [username, setUsername] = useState(null);
  const [error, setError] = useState('');

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
        setUsername(profileData.username); // Set username from profile

        // Fetch movies from multiple endpoints
        const moviesData = await fetchMovies();
        setMovies(moviesData);

        // Fetch liked movies
        const likedMoviesData = await fetchLikedMovies(token);
        const likedMoviesUrls = new Set(likedMoviesData.map(movie => movie.url));

        // Filter movies based on liked status
        const filteredMoviesData = moviesData.filter(movie => likedMoviesUrls.has(movie.url));
        setLikedMovies(filteredMoviesData);

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
    const fetchCommentsForSelectedMovie = async () => {
      if (!selectedMovieUrl || !username) {
        console.log('No movie selected or username missing');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token, skipping fetchCommentsForSelectedMovie');
          return;
        }

        // Fetch comments for the selected movie
        const commentsData = await fetchComments(selectedMovieUrl, token);
        // Filter comments by username
        const userComments = commentsData.filter(comment => comment.username === username);
        setMovieComments(userComments);
      } catch (err) {
        console.error('Error in fetchCommentsForSelectedMovie:', err);
        setError('An error occurred while fetching comments');
      }
    };

    fetchCommentsForSelectedMovie();
  }, [selectedMovieUrl, username]);

  // Function to format the date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'; // Handle empty or undefined date strings
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
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

          {/* Liked Movies Section */}
          <Card className="mb-4">
            <Card.Header as="h5">Liked Movies</Card.Header>
            <Card.Body>
              {likedMovies.length === 0 ? (
                <p>No liked movies found.</p>
              ) : (
                <ListGroup>
                  {likedMovies.map((movie) => (
                    <ListGroup.Item
                      key={movie.url}
                      action
                      onClick={() => setSelectedMovieUrl(movie.url)}
                    >
                      {movie.film}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>

          {/* Comments Section */}
          {selectedMovieUrl && (
            <>
              <Card className="mb-4">
                <Card.Header as="h5">Comments for Selected Movie</Card.Header>
                <Card.Body>
                  {movieComments.length === 0 ? (
                    <p>No comments found for this movie.</p>
                  ) : (
                    <ListGroup>
                      {movieComments.map((comment, index) => (
                        <ListGroup.Item key={index}>
                          <strong>{comment.username}</strong>: {comment.text}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  )}
                </Card.Body>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
