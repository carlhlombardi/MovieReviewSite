'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '@/app/(auth)/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { login } = useAuth(); // 👈 use login instead of setIsLoggedIn

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      // set context immediately
      login({ username });

      // redirect
      router.push(`/profile/${encodeURIComponent(username)}`);
    } catch (err) {
      setError(err.message || 'Login failed');
    }
  };

 return ( <div className="container mt-5"> <h2>Login</h2> {error && <Alert variant="danger">{error}</Alert>} <Form onSubmit={handleSubmit} autoComplete="off"> <Form.Group controlId="formUsername" className="mb-3"> <Form.Label>Username</Form.Label> <Form.Control type="text" placeholder="Enter username" value={username} minLength={3} onChange={(e) => setUsername(e.target.value)} required /> </Form.Group> <Form.Group controlId="formPassword" className="mb-3"> <Form.Label>Password</Form.Label> <Form.Control type="password" placeholder="Password" value={password} minLength={4} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /> </Form.Group> <Button variant="primary" type="submit">Login</Button> </Form> </div> ); }