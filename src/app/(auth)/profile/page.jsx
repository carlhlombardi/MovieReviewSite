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
    ];

    const responses = await Promise.all(endpoints.map(endpoint => fetch(endpoint)));
    const moviesArrays = await Promise.all(responses.map(response => response.json()));
    return moviesArrays.flat(); // Combine arrays into a single array
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
    console.error('Error fetching comments:', err);
    return [];
  }
};

// Function to fetch likes for a movie
const fetchLikes = async (movieUrl, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/likes?url=${encodeURIComponent(movieUrl)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch likes');
    return await response.json();
  } catch (error) {
    console.error('Error fetching likes:', error);
    return [];
  }
};

// Function to check if a movie is liked by the user
const fetchIsMovieLiked = async (movieUrl, token) => {
  try {
    const likes = await fetchLikes(movieUrl, token);
    return likes.length > 0;
  } catch (error) {
    console.error('Error fetching like status:', error);
    return false;
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
  const [userId, setUserId] = useState(null); // Store user ID

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
        setUserId(profileData.id); // Set user ID from profile
        console.log('Fetched profile data:', profileData);
  
        // Fetch movies from multiple endpoints
        const moviesData = await fetchMovies();
        console.log('Fetched movies:', moviesData); // Log fetched movies
        setMovies(moviesData);
  
        // Check if each movie is liked
        const likedMoviesData = await Promise.all(moviesData.map(async (movie) => {
          const likes = await fetchLikes(movie.url, token);
          const isLikedByUser = likes.some(like => like.userId === profileData.id);
          console.log(`Movie ${movie.url} liked by user ${profileData.id}:`, isLikedByUser);
          return { ...movie, liked: isLikedByUser };
        }));
  
        console.log('Liked movies data:', likedMoviesData); // Log liked movies data
  
        // Filter movies based on liked status
        const likedMoviesFiltered = likedMoviesData.filter(movie => movie.liked);
        console.log('Filtered liked movies:', likedMoviesFiltered); // Log filtered liked movies
        setLikedMovies(likedMoviesFiltered);
      } catch (err) {
        console.error('Error in fetchDataAsync:', err);
        setError('An error occurred');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchDataAsync();
  }, [router]); // No need to add `userId` here since it's fetched in the `fetchDataAsync` function
  
  useEffect(() => {
    const fetchFilteredMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token || userId === null) return;

        // Fetch comments for each movie and filter movies with comments
        const moviesWithComments = await Promise.all(movies.map(async (movie) => {
          const commentsData = await fetchComments(movie.url, token);
          // Filter comments by userId
          const userComments = commentsData.filter(comment => comment.userId === userId);
          console.log(`Movie ${movie.url} comments by user ${userId}:`, userComments);
          return { ...movie, hasComments: userComments.length > 0, comments: userComments };
        }));
  
        console.log('Movies with comments:', moviesWithComments); // Log movies with comments
  
        // Filter movies that have comments
        setFilteredMovies(moviesWithComments.filter(movie => movie.hasComments));
      } catch (err) {
        console.error('Error in fetchFilteredMovies:', err);
        setError('An error occurred while fetching comments');
      }
    };
  
    fetchFilteredMovies();
  }, [movies, userId]); // Add `userId` as a dependency here
  
  useEffect(() => {
    const fetchCommentsForSelectedMovie = async () => {
      if (!selectedMovieUrl || userId === null) return;

      try {
        const token = localStorage.getItem('token');

        if (!token) {
          console.log('No token found, redirecting to login');
          router.push('/login');
          return;
        }

        const commentsData = await fetchComments(selectedMovieUrl, token);
        // Filter comments by userId
        const userComments = commentsData.filter(comment => comment.userId === userId);
        console.log(`Comments for selected movie ${selectedMovieUrl} by user ${userId}:`, userComments);
        setComments(userComments);
      } catch (err) {
        console.error('Error in fetchCommentsForSelectedMovie:', err);
        setError('An error occurred while fetching comments');
      }
    };

    fetchCommentsForSelectedMovie();
  }, [selectedMovieUrl, router, userId]); // Add `userId` as a dependency here

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
            <Card.Header as="h5">Liked Movies</Card.Header>
            <Card.Body>
              {likedMovies.length > 0 ? (
                <ListGroup>
                  {likedMovies.map((movie) => (
                    <ListGroup.Item key={movie.url}>
                      <h5>{movie.film}</h5> {/* Display the movie title */}
                      <p>{movie.genre}</p> {/* Display the movie genre */}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p>No liked movies found.</p>
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
