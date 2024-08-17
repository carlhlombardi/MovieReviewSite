"use client"; // Ensure this is at the top

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch('https://movie-review-site-seven.vercel.app/api/auth/users');
      const data = await res.json();
      setUsers(data);
    };

    const fetchComments = async () => {
      const res = await fetch('https://movie-review-site-seven.vercel.app/api/auth/comments');
      const data = await res.json();
      setComments(data);
    };

    fetchUsers();
    fetchComments();
  }, []);

  const approveUser = async (id) => {
    await fetch('https://movie-review-site-seven.vercel.app/api/admin/auth/approve-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setUsers(users.filter(user => user.id !== id));
  };

  const approveComment = async (id) => {
    await fetch('https://movie-review-site-seven.vercel.app/api/admin/auth/approve-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    setComments(comments.filter(comment => comment.id !== id));
  };

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <h2>Pending Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.username} - {user.email}
            <button onClick={() => approveUser(user.id)}>Approve</button>
          </li>
        ))}
      </ul>

      <h2>Pending Comments</h2>
      <ul>
        {comments.map(comment => (
          <li key={comment.id}>
            {comment.content}
            <button onClick={() => approveComment(comment.id)}>Approve</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
