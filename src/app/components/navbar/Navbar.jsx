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

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/'; // Redirect after logout
  };

  const handleLogin = () => window.location.href = '/login';
  const handleRegister = () => window.location.href = '/register';
  const handleProfile = () => window.location.href = '/profile';

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
          <div className={styles.authButtonsWrapper}>
          <div className={styles.authButtons}>
            {isLoggedIn ? (
               <>
              <button onClick={handleProfile}>Profile</button>
              <button onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <button onClick={handleLogin}>Login</button>
                <button onClick={handleRegister}>Register</button>
              </>
            )}
          </div>
        </div>
        </div>
      </Container>
      <Offcanvas show={show} onHide={() => setShow(false)} placement="end" className="custom-offcanvas">
        <Offcanvas.Header>
          <button className={styles.closebtn} type="button" onClick={() => setShow(false)}>X</button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Links handleClose={() => setShow(false)} />
          <div className={styles.authButtonsWrapper}>
          <div className={styles.authButtons}>
            {isLoggedIn ? (
              <>
              <button onClick={handleProfile}>Profile</button>
              <button onClick={handleLogout}>Logout</button> 
              </>
            ) : (
              <>
                <button onClick={handleLogin}>Login</button>
                <button onClick={handleRegister}>Register</button>
              </>
            )}
          </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </Navbar>
  );
};

export default NavbarComponent;
