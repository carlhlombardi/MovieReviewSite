"use client"; // Ensure this is at the top

import { getCsrfToken } from 'next-auth/react';
import { useState } from 'react';

export default function Login({ csrfToken }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch('/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      window.location.href = '/'; // Redirect to homepage on success
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input name="csrfToken" type="hidden" defaultValue={csrfToken} />
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Sign In</button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {
      csrfToken: await getCsrfToken(context)
    }
  };
}
