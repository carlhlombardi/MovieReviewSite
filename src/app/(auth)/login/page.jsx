'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '@/app/(auth)/contexts/AuthContext';

// base URL in env var for security / flexibility
const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { setIsLoggedIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // don’t log credentials anywhere
        body: JSON.stringify({ username, password }),
        credentials: 'include', // allows secure cookies if backend sets them
      });

      if (!response.ok) {
        // show a generic error to avoid leaking info
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid username or password');
      }

      const data = await response.json();
      const { token } = data;

      // if backend sets HttpOnly cookie, you don’t need to store token at all
      if (token) {
        // prefer sessionStorage over localStorage
        sessionStorage.setItem('token', token);
      }

      setIsLoggedIn(true);
      router.push(`/profile/${encodeURIComponent(username)}`);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div className="container mt-5">
      <h2>Login</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit} autoComplete="off">
        <Form.Group controlId="formUsername" className="mb-3">
          <Form.Label>Username</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </Form.Group>
        <Form.Group controlId="formPassword" className="mb-3">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">Login</Button>
      </Form>
    </div>
  );
}
