"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Spinner, Card, Button, ListGroup } from 'react-bootstrap';

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchProfileAndComments = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        // Fetch user profile
        const profileResponse = await fetch('https://movie-review-site-seven.vercel.app/api/auth/profile', {
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

        // Fetch user comments
        const commentsResponse = await fetch('https://movie-review-site-seven.vercel.app/api/comments', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!commentsResponse.ok) {
          const errorData = await commentsResponse.json();
          setError(errorData.message || 'An error occurred');
          return;
        }

        const commentsData = await commentsResponse.json();
        setComments(commentsData);
      } catch (err) {
        setError('An error occurred');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileAndComments();
  }, [router]);

  // Function to format the date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, options);
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://movie-review-site-seven.vercel.app/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'An error occurred while deleting the comment');
        return;
      }

      // Update comments list after deletion
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (err) {
      setError('An error occurred while deleting the comment');
    }
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
          <Card>
            <Card.Header as="h5">Your Comments</Card.Header>
            <Card.Body>
              <ListGroup>
                {comments.length > 0 ? (
                  comments.map(comment => (
                    <ListGroup.Item key={comment.id}>
                      <div>{comment.text}</div>
                      <Button
                        variant="danger"
                        className="mt-2"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        Delete
                      </Button>
                    </ListGroup.Item>
                  ))
                ) : (
                  <ListGroup.Item>No comments found.</ListGroup.Item>
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}
