"use client";

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Alert, Spinner, Table, Button } from 'react-bootstrap';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');

        if (!token) {
          router.push('/login');
          return;
        }

        const response = await axios.get('https://movie-review-site-seven.vercel.app/api/admin', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setUsers(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const handleApprove = async (userId, approved) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        router.push('/login');
        return;
      }

      await axios.post('https://movie-review-site-seven.vercel.app/api/admin', { userId, approved }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUsers(users.map(user => 
        user.id === userId ? { ...user, approved } : user
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred');
    }
  };

  if (isLoading) return <Spinner animation="border" />;

  return (
    <div className="container mt-5">
      <h2>Admin Portal</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Approved</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{user.approved ? 'Yes' : 'No'}</td>
              <td>
                <Button
                  variant={user.approved ? "danger" : "success"}
                  onClick={() => handleApprove(user.id, !user.approved)}
                >
                  {user.approved ? 'Disapprove' : 'Approve'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
