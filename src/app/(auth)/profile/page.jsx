"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Alert, Spinner, Card, Form } from 'react-bootstrap';
import Comments from '@/app/components/comments/comments.jsx'; // Ensure this path is correct

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
    return moviesArrays.flat();
  } catch (error) {
    console.error('Error fetching movies:', error);
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

const fetchLikedComments = async (token) => {
  try {
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/liked-comments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch liked comments');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching liked comments:', error);
    return [];
  }
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [movies, setMovies] = useState([]);
  const [likedMovies, setLikedMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [likedComments, setLikedComments] = useState([]);
  const [username, setUsername] = useState(null);
  const [error, setError] = useState('');
  const [selectedMovieUrl, setSelectedMovieUrl] = useState('');

  const router = useRouter();
  const { username: profileUsername } = useParams();
  const baseUrl = 'https://movie-review-site-seven.vercel.app';

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
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          setError(errorData.message || 'An error occurred');
          router.push('/login');
          return;
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);
        setUsername(profileData.username);

        // Fetch liked movies
        const likedMoviesResponse = await fetch(`${baseUrl}/api/auth/liked-movies`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!likedMoviesResponse.ok) {
          const errorData = await likedMoviesResponse.json();
          setError(errorData.message || 'An error occurred');
          router.push('/login');
          return;
        }

        const likedMoviesData = await likedMoviesResponse.json();
        setLikedMovies(likedMoviesData.likedMovies);

        // Fetch liked comments
        const likedCommentsData = await fetchLikedComments(token);
        setLikedComments(likedCommentsData.likedComments);

        // Fetch all movies
        const allMovies = await fetchMovies();
        setMovies(allMovies);

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

        const moviesWithComments = await Promise.all(movies.map(async (movie) => {
          const commentsData = await fetchComments(movie.url, token);
          const userComments = commentsData.filter(comment => comment.username === username);
          return { ...movie, hasComments: userComments.length > 0, comments: userComments };
        }));

        setFilteredMovies(moviesWithComments.filter(movie => movie.hasComments));
      } catch (err) {
        console.error('Error in fetchFilteredMovies:', err);
        setError('An error occurred while fetching comments');
      }
    };

    fetchFilteredMovies();
  }, [movies, username]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Intl.DateTimeFormat('en-US', options).format(new Date(dateString));
  };

  if (isLoading) {
    return (
      <div className="container mt-5 text-center">
        <h2>Loading profile...</h2>
        <Spinner animation="border" />
      </div>
    );
  }

  const isOwnProfile = profile?.username === profileUsername;

  return (
    <div className="container mt-5">
      <h2>{isOwnProfile ? `Welcome back, ${profile.firstname}!` : `Profile of ${profileUsername}`}</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {profile && (
        <>
          <Card className="mb-4">
            <Card.Header as="h5">Profile Details</Card.Header>
            <Card.Body>
              <Card.Text>
                <strong>Name:</strong> {isOwnProfile ? `${profile.firstname} ${profile.lastname}` : profileUsername}
              </Card.Text>
              <Card.Text>
                <strong>Date Joined:</strong> {formatDate(profile.date_joined)}
              </Card.Text>
            </Card.Body>
          </Card>

          {isOwnProfile && (
            <>
              <Card className="mb-4">
                <Card.Header as="h5">Liked Movies</Card.Header>
                <Card.Body>
                  {likedMovies.length > 0 ? (
                    <ul>
                      {likedMovies.map((movie) => (
                        <li key={movie.url}>
                          <a href={`https://movie-review-site-seven.vercel.app/genre/${movie.genre}/${movie.url}`}>{movie.title}</a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No liked movies found.</p>
                  )}
                </Card.Body>
              </Card>

              <Card className="mb-4">
                <Card.Header as="h5">Liked Comments</Card.Header>
                <Card.Body>
                  {likedComments.length > 0 ? (
                    <ul>
                      {likedComments.map((comment) => (
                        <li key={comment.id}>
                          <p><strong>{comment.username}:</strong> {comment.text}</p>
                          <p><em>Movie: {comment.movieTitle}</em></p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No liked comments found.</p>
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
            </>
          )}

          {selectedMovieUrl && isOwnProfile && (
            <Comments movieUrl={selectedMovieUrl} />
          )}
        </>
      )}
    </div>
  );
}
