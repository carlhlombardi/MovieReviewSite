// Ensure this file is located at /pages/logout/page.js or similar location
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import from 'next/navigation'
import { Spinner } from 'react-bootstrap';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        // Make sure the URL matches the API route exactly
        const response = await fetch('/api/auth/logout', { method: 'POST' });

        // Check if the response is okay
        if (!response.ok) {
          throw new Error('Logout failed');
        }

        // Remove token from localStorage
        localStorage.removeItem('token');

        // Redirect to login page
        router.push('/login');
      } catch (error) {
        console.error('Logout failed:', error);
        // Handle logout error if needed
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
