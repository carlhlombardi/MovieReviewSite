"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from 'react-bootstrap';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch('https://movie-review-site-seven.vercel.app/api/auth/logout', { method: 'POST' });
        localStorage.removeItem('token');
        router.push('/login');
      } catch (error) {
        console.error('Logout error:', error);
      }
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
