"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Alert, Spinner } from 'react-bootstrap';

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
          router.push('https://movie-review-site-seven.vercel.app/login');
          return;
        }

        const response = await axios.get('https://movie-review-site-seven.vercel.app/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred');
        router.push('https://movie-review-site-seven.vercel.app/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [router]);

  if (isLoading) return <Spinner animation="border" />;

  return (
    <div className="container mt-5">
      <h2>Profile</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {profile && (
        <div>
          <p><strong>Username:</strong> {profile.username}</p>
          <p><strong>Email:</strong> {profile.email}</p>
        </div>
      )}
    </div>
  );
}
