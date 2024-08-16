"use client";

import { useState, useEffect } from 'react';
import { Container, Row, Col, Image, Alert, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        const response = await axios.get('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          setUser(response.data);
        } else {
          setError('Failed to fetch user data');
          router.push('/login');
        }
      } catch (err) {
        setError('An error occurred while fetching user data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  const defaultAvatar = "/default-avatar.png";

  return (
    <Container className="mt-5">
      <Row>
        <Col className="text-center">
          <Image
            src={defaultAvatar}
            alt="Default Avatar"
            width={150}
            height={150}
            roundedCircle
          />
          <h2 className="mt-3">{user?.username}</h2>
        </Col>
      </Row>
    </Container>
  );
}
