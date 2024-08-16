"use client";

import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Form, Button, Alert } from 'react-bootstrap';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Send login request to the server
      const response = await axios.post('/api/auth/login', { username, password });

      // Extract token from the response
      const { token } = response.data;

      if (token) {
        // Store the token in localStorage
        localStorage.setItem('token', token);

        // Redirect to profile page or dashboard
        router.push('/profile');
      } else {
        throw new Error('Token not found in response');
      }

    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
      console.error('Login error:', err);
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group controlId="formUsername">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group controlId="formPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">
          Login
        </Button>
      </Form>
    </div>
  );
}
