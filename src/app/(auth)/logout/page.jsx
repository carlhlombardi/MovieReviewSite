"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from 'react-bootstrap';
import { useAuth } from '@/app/(auth)/contexts/AuthContext';

export default function LogoutPage() {
  const router = useRouter();
  const { setIsLoggedIn } = useAuth();

  useEffect(() => {
    const logout = async () => {
      try {
        await fetch('https://movie-review-site-seven.vercel.app/api/auth/logout', {
          method: 'POST',
          credentials: 'include', // send cookie so backend can clear it
        });
        // No localStorage anymore
        setIsLoggedIn(false); // update context
        router.push('/login'); // relative route
      } catch (error) {
        console.error('Logout error:', error);
      }
    };
    logout();
  }, [router, setIsLoggedIn]);

  return (
    <div className="container mt-5">
      <h2>Logging out...</h2>
      <Spinner animation="border" />
    </div>
  );
}
