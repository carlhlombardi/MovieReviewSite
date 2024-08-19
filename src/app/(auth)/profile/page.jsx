"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Spinner, Card, Button } from 'react-bootstrap';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        // Decode the JWT token to get user info
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || 'An error occurred');
          router.push('/login');
          return;
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError('An error occurred');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

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
        <Card>
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
              <strong>Date Joined:</strong> {profile.date_joined}
            </Card.Text>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
