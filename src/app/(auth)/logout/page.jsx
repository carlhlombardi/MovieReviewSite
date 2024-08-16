"use client"; // Ensure this is at the top

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Spinner } from 'react-bootstrap';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('token');
      router.push('/login');
    };

    logout();
  }, [router]);

  return (
    <div className="container mt-5">
      <h2>Logging out...</h2>
      <Spinner animation="border" />
    </div>
  );
}
