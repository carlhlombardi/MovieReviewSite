import { useState, useEffect } from 'react';
import axios from 'axios';
import { ListGroup, Button, Alert, Spinner } from 'react-bootstrap';
import { useRouter } from 'next/router';

export default function AdminPage({ initialUsers, isAdmin }) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      router.push('/login'); // Redirect non-admin users
    }
  }, [isAdmin, router]);

  const approveUser = async (userId) => {
    try {
      await axios.post('/api/auth/approve-user', { userId });
      setUsers(users.map(user => (user.id === userId ? { ...user, approved: true } : user)));
    } catch (error) {
      setError('Failed to approve user');
    }
  };

  if (!isAdmin) {
    return <Spinner animation="border" />;
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

// Server-side rendering to check for admin status
export async function getServerSideProps(context) {
  const token = context.req.cookies.token;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-admin`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status !== 200) {
    return { props: { initialUsers: [], isAdmin: false } };
  }

  const data = await res.json();

  if (!data.isAdmin) {
    return { props: { initialUsers: [], isAdmin: false } };
  }

  const usersRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const users = await usersRes.json();

  return { props: { initialUsers: users, isAdmin: true } };
}
