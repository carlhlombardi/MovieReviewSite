"use client";

import React, { useState, useEffect } from 'react';
import { Navbar, Container, Offcanvas, Button } from 'react-bootstrap';
import { useAuth } from '@/app/(auth)/contexts/AuthContext';
import Links from '@/app/components/navbar/links/Links.jsx';
import Image from 'next/image';
import styles from './navbar.module.css';

const NavbarComponent = () => {
  const [show, setShow] = useState(false);
  const { isLoggedIn, setIsLoggedIn } = useAuth();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setIsLoggedIn(response.ok);
        } catch {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, [setIsLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/'; // Redirect after logout
  };

  const handleLogin = () => window.location.href = '/login';
  const handleRegister = () => window.location.href = '/register';

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
          <button className={styles.navbartoggler} type="button" onClick={() => setShow(true)}>
            <span className={styles.navbartogglericon}>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </span>
          </button>
        </div>
        <div className="d-none d-lg-flex">
          <Links handleClose={() => setShow(false)} />
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
      <Offcanvas show={show} onHide={() => setShow(false)} placement="end" className="custom-offcanvas">
        <Offcanvas.Header>
          <button className={styles.closebtn} type="button" onClick={() => setShow(false)}>X</button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Links handleClose={() => setShow(false)} />
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
