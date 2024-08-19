"use client";

import React, { useState, useEffect } from 'react';
import { Navbar, Container, Offcanvas, Button } from 'react-bootstrap';
import Links from '@/app/components/navbar/links/Links.jsx';
import Image from 'next/image';
import styles from './navbar.module.css';

const checkUserLoggedIn = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.ok;
  } catch (error) {
    console.error('Failed to check login status', error);
    return false;
  }
};

const NavbarComponent = () => {
  const [show, setShow] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkLoginStatus = async () => {
      const loggedIn = await checkUserLoggedIn();
      setIsLoggedIn(loggedIn);
    };

    checkLoginStatus();
    
    // Add an event listener to listen for `storage` events
    const handleStorageChange = () => {
      checkLoginStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup the event listener
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleLogin = () => {
    window.location.href = '/login'; // Redirect to the login page
  };

  const handleRegister = () => {
    window.location.href = '/register'; // Redirect to the registration page
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/'; // Redirect to home or a specific page after logout
  };

  return (
    <Navbar expand="lg" className="navbar-dark">
      <Container>
        <Navbar.Brand href="/">
          <Image
            src="/images/logo/logo.png"
            alt="Logo"
            width={160}
            height={80}
            className="img-fluid"
          />
        </Navbar.Brand>
        <div className="d-lg-none">
          <button className={styles.navbartoggler} type="button" onClick={handleShow}>
            <span className={styles.navbartogglericon}>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </span>
          </button>
        </div>
        <div className="d-none d-lg-flex">
          <Links handleClose={handleClose} />
          <div className={styles.authButtons}>
            {isLoggedIn ? (
              <Button variant="outline-danger" onClick={handleLogout} className={styles.authButton}>Logout</Button>
            ) : (
              <>
                <Button variant="outline-primary" onClick={handleLogin} className={`${styles.authButton} me-2`}>Login</Button>
                <Button variant="outline-secondary" onClick={handleRegister} className={styles.authButton}>Register</Button>
              </>
            )}
          </div>
        </div>
      </Container>
      <Offcanvas show={show} onHide={handleClose} placement="end" className="custom-offcanvas">
        <Offcanvas.Header>
          <button className={styles.closebtn} type="button" onClick={handleClose}>X</button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Links handleClose={handleClose} />
          <div className={styles.authButtons}>
            {isLoggedIn ? (
              <Button variant="outline-danger" onClick={handleLogout} className={styles.authButton}>Logout</Button>
            ) : (
              <>
                <Button variant="outline-primary" onClick={handleLogin} className={`${styles.authButton} me-2`}>Login</Button>
                <Button variant="outline-secondary" onClick={handleRegister} className={styles.authButton}>Register</Button>
              </>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </Navbar>
  );
};

export default NavbarComponent;
