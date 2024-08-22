"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Spinner, Card, Form } from 'react-bootstrap';
import Comments from '@/app/components/comments/comments.jsx'; // Ensure this path is correct

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

// Function to fetch liked status of a movie
const fetchLikedStatus = async (movieUrl, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/likes?url=${encodeURIComponent(movieUrl)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch liked status');
    }
    return await response.json(); // Returns { liked: true/false }
  } catch (error) {
    console.error('Error fetching liked status:', error);
    return { liked: false }; // Default to not liked if there's an error
  }
};

// Function to fetch comments for a movie
const fetchComments = async (movieUrl, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/comments?url=${encodeURIComponent(movieUrl)}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch comments');
    }
    return await response.json(); // Returns comments array
  } catch (error) {
    console.error('Error fetching comments:', error);
    return []; // Return empty array if there's an error
  }
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null); // State to hold user profile data
  const [isLoading, setIsLoading] = useState(true); // State to manage loading state
  const [movies, setMovies] = useState([]); // State to hold all movies
  const [likedMovies, setLikedMovies] = useState([]); // State to hold liked movies
  const [filteredMovies, setFilteredMovies] = useState([]); // State to hold movies with comments
  const [username, setUsername] = useState(null); // State to hold the username
  const [error, setError] = useState(''); // State to hold any error messages
  const [selectedMovieUrl, setSelectedMovieUrl] = useState(''); // State to hold selected movie URL

  const router = useRouter(); // Router instance for navigation
  const baseUrl = 'https://movie-review-site-seven.vercel.app'; // Base URL for API requests

  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        const token = localStorage.getItem('token'); // Get the JWT token from local storage
    
        if (!token) {
          // If token is not present, redirect to login page
          console.log('No token found, redirecting to login');
          router.push('/login');
          return;
        }
    
        // Fetch user profile
        const profileResponse = await fetch(`${baseUrl}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
    
        if (!profileResponse.ok) {
          // If profile fetch fails, handle the error and redirect to login
          const errorData = await profileResponse.json();
          setError(errorData.message || 'An error occurred');
          router.push('/login');
          return;
        }
    
        // Parse and set user profile data
        const profileData = await profileResponse.json();
        setProfile(profileData);
        setUsername(profileData.username); // Store the username for later use
    
        // Fetch liked movies directly
        const likedMoviesResponse = await fetch(`${baseUrl}/api/auth/liked-movies`, {
          headers: { Authorization: `Bearer ${token}` }
        });
    
        if (!likedMoviesResponse.ok) {
          const errorData = await likedMoviesResponse.json();
          setError(errorData.message || 'An error occurred');
          router.push('/login');
          return;
        }
    
        // Parse and set liked movies data
        const likedMoviesData = await likedMoviesResponse.json();
        setLikedMovies(likedMoviesData.likedMovies);
    
        console.log('Liked Movies:', likedMoviesData.likedMovies); // Log the final list of liked movies
    
      } catch (err) {
        // Handle errors and redirect to login if something goes wrong
        console.error('Error in fetchDataAsync:', err);
        setError('An error occurred');
        router.push('/login');
      } finally {
        setIsLoading(false); // Set loading state to false after data fetching is complete
      }
    };

    fetchDataAsync(); // Invoke the async function to fetch data
  }, [router]); // Dependency array ensures this effect runs on mount and when `router` changes

  useEffect(() => {
    const fetchFilteredMovies = async () => {
      if (!username) {
        console.log('No username, skipping fetchFilteredMovies');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token, skipping fetchFilteredMovies');
          return;
        }

        // Fetch comments for each movie and filter movies with comments
        const moviesWithComments = await Promise.all(movies.map(async (movie) => {
          const commentsData = await fetchComments(movie.url, token);
          // Filter comments by username
          const userComments = commentsData.filter(comment => comment.username === username);
          return { ...movie, hasComments: userComments.length > 0, comments: userComments };
        }));

        // Filter movies that have comments
        setFilteredMovies(moviesWithComments.filter(movie => movie.hasComments));
      } catch (err) {
        console.error('Error in fetchFilteredMovies:', err);
        setError('An error occurred while fetching comments');
      }
    };

    fetchFilteredMovies();
  }, [movies, username]);

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

          <Card className="mb-4">
            <Card.Header as="h5">Liked Movies</Card.Header>
            <Card.Body>
              {likedMovies.length > 0 ? (
                <ul>
                  {likedMovies.map((movie) => (
                    <li key={movie.url}>
                      <a href={movie.url} target="_blank" rel="noopener noreferrer">
                        {movie.film}
                      </a>
                    </li>
                  ))}
                </ul>
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

          {/* Use the Comments component here */}
          {selectedMovieUrl && (
            <Comments movieUrl={selectedMovieUrl} isProfilePage={true} />
          )}
        </>
      )}
    </div>
  );
}
