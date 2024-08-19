"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Spinner, Card, Button, ListGroup } from 'react-bootstrap';

// Fetch profile and liked movies
const fetchProfileAndLikedMovies = async (baseUrl, token) => {
  try {
    // Fetch user profile
    const profileResponse = await fetch(`${baseUrl}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      throw new Error(errorData.message || 'An error occurred while fetching profile');
    }

    const profileData = await profileResponse.json();

    // Fetch liked movies
    const likedMoviesResponse = await fetch(`${baseUrl}/api/auth/likes`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!likedMoviesResponse.ok) {
      const errorData = await likedMoviesResponse.json();
      throw new Error(errorData.message || 'An error occurred while fetching liked movies');
    }

    const likedMoviesData = await likedMoviesResponse.json();

    return { profile: profileData, likedMovies: likedMoviesData };
  } catch (err) {
    console.error(err);
    return { profile: null, likedMovies: [] };
  }
};

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [likedMovies, setLikedMovies] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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

        const { profile: profileData, likedMovies: likedMoviesData } = await fetchProfileAndLikedMovies(baseUrl, token);
        setProfile(profileData);
        setLikedMovies(likedMoviesData);
      } catch (err) {
        setError('An error occurred');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAsync();
  }, [router]);

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
        </>
      )}
    </div>
  );
}
