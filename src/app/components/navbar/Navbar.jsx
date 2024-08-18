"use client";

import React, { useState, useEffect } from 'react';
import { Navbar, Container, Offcanvas, Nav, Button } from 'react-bootstrap';
import Links from '@/app/components/navbar/links/Links.jsx';
import Image from 'next/image';
import styles from './navbar.module.css';
import { useRouter } from 'next/navigation'; // For navigation in Next.js

const NavbarComponent = () => {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState(null); // State to manage user authentication
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      fetch('https://movie-review-site-seven.vercel.app/api/auth/profile', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(response => response.json())
        .then(data => setUser(data.username))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        });
    } else {
      setUser(null);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/'); // Redirect to home or a specific page after logout
  };

  const handleLogin = () => {
    router.push('/login'); // Redirect to the login page
  };

  const handleRegister = () => {
    router.push('/register'); // Redirect to the registration page
  };

  return (
    <Navbar expand="lg" className="navbar-dark">
      <Container>
        <Navbar.Brand href="/">
          <Image
            src="/images/logo/logo.png" // Use the image URL directly from the database
            alt="Logo" // Alt text for accessibility
            width={160}
            height={80}
            className="img-fluid"
          />
        </Navbar.Brand>
        <div className="d-lg-none">
          <button className={styles.navbartoggler} type="button" onClick={() => setShow(true)}>
            <span className={styles.navbartogglericon}>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </span>
          </button>
        </div>
        <div className="d-none d-lg-flex">
          <Links />
          {user ? (
            <Button variant="outline-danger" onClick={handleLogout}>Logout</Button>
          ) : (
            <>
              <Button variant="outline-primary" onClick={handleLogin} className="me-2">Login</Button>
              <Button variant="outline-secondary" onClick={handleRegister}>Register</Button>
            </>
          )}
        </div>
      </Container>
      <Offcanvas show={show} onHide={() => setShow(false)} placement="end" className="custom-offcanvas">
        <Offcanvas.Header>
          <button className={styles.closebtn} type="button" onClick={() => setShow(false)}>X</button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Links handleClose={() => setShow(false)} />
          {user ? (
            <Button variant="outline-danger" onClick={handleLogout}>Logout</Button>
          ) : (
            <>
              <Button variant="outline-primary" onClick={handleLogin} className="me-2">Login</Button>
              <Button variant="outline-secondary" onClick={handleRegister}>Register</Button>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </Navbar>
  );
};

export default NavbarComponent;
