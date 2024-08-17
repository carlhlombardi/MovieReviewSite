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
        console.log('Token:', token);

        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log('Response Status:', response.status);
        if (!response.ok) {
          const errorData = await response.json();
          console.log('Error Data:', errorData);
          setError(errorData.message || 'An error occurred');
          router.push('/login');
          return;
        }

        const data = await response.json();
        console.log('Profile Data:', data);
        setProfile(data);
      } catch (err) {
        console.error('Fetch Error:', err);
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
      <h2>Welcome back, {profile?.username}!</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {profile && (
        <Card>
          <Card.Header as="h5">Profile Details</Card.Header>
          <Card.Body>
            <Card.Title>{profile.username}</Card.Title>
            <Card.Text>
              <strong>Email:</strong> {profile.email}
            </Card.Text>
            <Button variant="primary" onClick={() => router.push('/edit-profile')}>
              Edit Profile
            </Button>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
