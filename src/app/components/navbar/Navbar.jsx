"use client";

import React, { useState, useEffect } from 'react';
import { Navbar, Container, Offcanvas, Button } from 'react-bootstrap';
import Links from '@/app/components/navbar/links/Links.jsx';
import Image from 'next/image';
import styles from './navbar.module.css';
import { useRouter } from 'next/navigation';

const NavbarComponent = () => {
  const [show, setShow] = useState(false);
  const [user, setUser] = useState(null); // State to manage user authentication
  const router = useRouter();

  // Function to fetch user data
  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        setUser(data.username);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } else {
      setUser(null);
    }
  };

  // Fetch user data when the component mounts
  useEffect(() => {
    fetchUserData();
  }, []);

  // Fetch user data when navigating to the profile page or on page load
  useEffect(() => {
    const handleRouteChange = () => {
      fetchUserData();
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    // Cleanup the event listener
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router]);

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
            <button className={styles.logbutton} type="button" onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <button className={styles.logbutton} type="button" onClick={handleLogin}>Login</button>
              <button className={styles.logbutton} type="button" onClick={handleRegister}>Register</button>
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
            <button className={styles.logbutton} type="button" onClick={handleLogout}>Logout</button>
          ) : (
            <>
              <button className={styles.logbutton} type="button" onClick={handleLogin}>Login</button>
              <button className={styles.logbutton} type="button" onClick={handleRegister}>Register</button>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </Navbar>
  );
};

export default NavbarComponent;
