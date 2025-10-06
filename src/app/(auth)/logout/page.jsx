"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from 'react-bootstrap';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        // Include credentials so the cookie is sent and can be cleared
        await fetch('https://movie-review-site-seven.vercel.app/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });

        // If you store other state in a context (like isLoggedIn), reset it here if needed
        // setIsLoggedIn(false); // if you use context

        router.push('/login'); // Redirect after logout
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
