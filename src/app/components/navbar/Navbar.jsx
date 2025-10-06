"use client";

import React, { useState } from 'react';
import { Navbar, Container, Offcanvas } from 'react-bootstrap';
import { useAuth } from '@/app/(auth)/contexts/AuthContext';
import Links from '@/app/components/navbar/links/Links.jsx';
import Image from 'next/image';
import styles from './navbar.module.css';

const NavbarComponent = () => {
  const [show, setShow] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      logout();                // clear context state
      window.location.href = '/'; // or use router.push('/')
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleLogin = () => window.location.href = '/login';
  const handleRegister = () => window.location.href = '/register';

  const handleProfile = () => {
    if (user?.username) {
      window.location.href = `/profile/${user.username}`;
    } else {
      console.error('Username is required to redirect to profile.');
    }
  };

  const handleCollection = () => {
    if (user?.username) {
      window.location.href = `/profile/${user.username}/mycollection`;
    } else {
      console.error('Username is required to have a collection.');
    }
  };

  const handleWishlist = () => {
    if (user?.username) {
      window.location.href = `/profile/${user.username}/wantedformycollection`;
    } else {
      console.error('Username is required to have a wishlist.');
    }
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

        {/* ...the rest stays the same */}

        <div className="d-none d-lg-flex">
          <Links handleClose={() => setShow(false)} />
          <div className={styles.authButtonsWrapper}>
            <div className={styles.authButtons}>
              {isLoggedIn ? (
                <>
                  <button onClick={handleProfile}>Profile</button>
                  <button onClick={handleCollection}>My Collection</button>
                  <button onClick={handleWishlist}>Wanted For Collection</button>
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

      {/* Offcanvas same idea */}
    </Navbar>
  );
};

export default NavbarComponent;
