"use client"

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Alert, Spinner, Card, Form } from 'react-bootstrap';
import Comments from '@/app/components/comments/comments.jsx';
import Image from 'next/image';

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

    // Fetch data from all endpoints
    const responses = await Promise.all(endpoints.map(async (endpoint) => {
      try {
        const response = await fetch(endpoint);
        if (!response.ok) {
          console.error(`Failed to fetch from ${endpoint}: ${response.statusText}`);
          return [];
        }
        const data = await response.json();
        return data; // Assuming `data` is an array of movie objects
      } catch (error) {
        console.error(`Error fetching from ${endpoint}:`, error);
        return [];
      }
    }));

    // Flatten the array of arrays into a single array
    const movies = responses.flat();

    // Optional: Filter out duplicate movies by URL
    const uniqueMovies = Array.from(new Set(movies.map(movie => movie.url)))
      .map(url => movies.find(movie => movie.url === url));

    // Extract image_url (assuming it is a field in your movie object)
    const moviesWithImgUrl = uniqueMovies.map(movie => ({
      ...movie,
      image_url: movie.image_url // Make sure this field exists in your movie object
    }));

    return moviesWithImgUrl;

  } catch (error) {
    console.error('Error fetching movies:', error);
    return [];
  }
};

// Function to fetch comments for a movie
const fetchComments = async (movieUrl, token) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/comments?url=${encodeURIComponent(movieUrl)}`, {
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
  const [profile, setProfile] = useState(null); // State to hold profile data
  const [isLoading, setIsLoading] = useState(true); // State to manage loading state
  const [movies, setMovies] = useState([]); // State to hold all movies
  const [likedMovies, setLikedMovies] = useState([]); // State to hold liked movies
  const [watchedMovies, setWatchedMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]); // State to hold movies with comments
  const [username, setUsername] = useState(null); // State to hold the username
  const [error, setError] = useState(''); // State to hold any error messages
  const [selectedMovieUrl, setSelectedMovieUrl] = useState(''); // State to hold selected movie URL

  const router = useRouter(); // Router instance for navigation
  const { username: profileUsername } = useParams(); // Extract username from URL parameter
  const baseUrl = 'https://movie-review-site-seven.vercel.app'; // Base URL for API requests

  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        const token = localStorage.getItem('token'); // Get the JWT token from local storage
    
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
    
        // Parse and set liked movies data
        const likedMoviesData = await likedMoviesResponse.json();
        setLikedMovies(likedMoviesData.likedMovies);
        

        // Fetch watched movies
        const watchedMoviesResponse = await fetch(`${baseUrl}/api/auth/watched-movies`, {
          headers: { Authorization: `Bearer ${token}` }
        });
            
          if (!watchedMoviesResponse.ok) {
            const errorData = await watchedMoviesResponse.json();
            setError(errorData.message || 'An error occurred');
            router.push('/login');
            return;
          }
            
        // Parse and set watched movies data
        const watchedMoviesData = await watchedMoviesResponse.json();
        setWatchedMovies(watchedMoviesData.watchedMovies);

        // Fetch all movies
        const allMovies = await fetchMovies();
        setMovies(allMovies);
    
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
  }, [router]);

  useEffect(() => {
    const fetchFilteredMovies = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.log('No token, skipping fetchFilteredMovies');
          return;
        }

        // Fetch comments for each movie and filter movies with comments
        const moviesWithComments = await Promise.all(movies.map(async (movie) => {
          const commentsData = await fetchComments(movie.url, token);
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
  }, [movies, username]); // Ensure this effect runs when `movies` or `username` changes

  // Function to format the date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'; // Handle empty or undefined date strings
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
                     <li key={movie.url} style={{ listStyleType: 'none' }}>
                     <a href={`${baseUrl}/${movie.genre}/${movie.url}`}>
                       <Image 
                         src={`${baseUrl}/images/${movie.genre}/${movie.image_url}`}
                         alt={movie.title} 
                         width={150} 
                         height={225} 
                         style={{ objectFit: 'cover' }} 
                         unoptimized
                       />
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
              <Card.Header as="h5">Watchlist Movies</Card.Header>
                <Card.Body>
                     {watchedMovies.length > 0 ? (
                     <ul>
                     {watchedMovies.map((movie) => (
                       <li key={movie.url} style={{ listStyleType: 'none' }}>
                         <a href={`${baseUrl}/${movie.genre}/${movie.url}`}>
                           <Image 
                             src={`${baseUrl}/images/${movie.genre}/${movie.image_url}`}
                             alt={movie.title} 
                             width={150} 
                             height={225} 
                             style={{ objectFit: 'cover' }} 
                             unoptimized
                          />
                         </a>
                       </li>
                     ))}
                   </ul>
                          ) : (
                            <p>No liked movies found.</p>
                          )}
                        </Card.Body>
                      </Card>
          </>
          )}

          {isOwnProfile && (
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
          )}

          {/* Use the Comments component here */}
          {selectedMovieUrl && isOwnProfile && (
            <Comments movieUrl={selectedMovieUrl} isProfilePage={true} />
          )}
        </>
      )}
    </div>
  );
}
