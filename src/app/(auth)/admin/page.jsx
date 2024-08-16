"use client"; // Ensure this is at the top

import { useState, useEffect } from 'react';
import axios from 'axios';
import { ListGroup, Button, Alert, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/navigation'; // Import from 'next/navigation'

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const router = useRouter();

  useEffect(() => {
    // Fetch admin status and users on mount
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token'); // Adjust based on your token storage method

        if (!token) {
          throw new Error('No token found');
        }

        // Verify admin status
        const adminRes = await axios.get('/api/auth/admin', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (adminRes.status !== 200 || !adminRes.data.isAdmin) {
          setIsAdmin(false);
          router.push('/login'); // Redirect non-admin users
          return;
        }

        setIsAdmin(true);

        // Fetch users
        const usersRes = await axios.get('/api/auth/users', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUsers(usersRes.data);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const approveUser = async (userId) => {
    try {
      const token = localStorage.getItem('token'); // Adjust based on your token storage method

      await axios.post('/api/auth/approve-user', { userId }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setUsers(users.map(user => (user.id === userId ? { ...user, approved: true } : user)));
    } catch (error) {
      setError('Failed to approve user');
    }
  };

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  if (!isAdmin) {
    return null; // Optionally, you can display a message or redirect
  }

  return (
    <div className="container mt-5">
      <h2>Admin Page</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <ListGroup>
        {users.map((user) => (
          <ListGroup.Item key={user.id}>
            {user.username} - {user.email}
            {!user.approved && (
              <Button
                variant="success"
                className="ml-3"
                onClick={() => approveUser(user.id)}
              >
                Approve
              </Button>
            )}
          </ListGroup.Item>
        ))}
      </ListGroup>
    </div>
  );
}
