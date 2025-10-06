"use client";

import React, { useState } from "react";
import { Navbar, Container, Offcanvas } from "react-bootstrap";
import { useAuth } from "@/app/(auth)/contexts/AuthContext"; // Adjust the path as needed
import Links from "@/app/components/navbar/links/Links.jsx";
import Image from "next/image";
import styles from "./navbar.module.css";

const NavbarComponent = () => {
  const [show, setShow] = useState(false);
  const { isLoggedIn, user, logout } = useAuth(); // ✅ use logout instead of setIsLoggedIn

  const handleLogout = async () => {
    try {
      // Clear server cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      // Clear context immediately
      logout();
      // Optionally redirect home
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleLogin = () => (window.location.href = "/login");
  const handleRegister = () => (window.location.href = "/register");

  const handleProfile = () => {
    if (user && user.username) {
      window.location.href = `/profile/${user.username}`;
    } else {
      console.error("Username is required to redirect to profile.");
    }
  };

  const handleCollection = () => {
    if (user && user.username) {
      window.location.href = `/profile/${user.username}/mycollection`;
    } else {
      console.error("Username is required to have a collection.");
    }
  };

  const handleWishlist = () => {
    if (user && user.username) {
      window.location.href = `/profile/${user.username}/wantedformycollection`;
    } else {
      console.error("Username is required to have a wishlist.");
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
        {/* mobile toggler */}
        <div className="d-lg-none">
          <button
            className={styles.navbartoggler}
            type="button"
            onClick={() => setShow(true)}
          >
            <span className={styles.navbartogglericon}>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
              <span className={styles.bar}></span>
            </span>
          </button>
        </div>

        {/* desktop links */}
        <div className="d-none d-lg-flex">
          <Links handleClose={() => setShow(false)} />
          <div className={styles.authButtonsWrapper}>
            <div className={styles.authButtons}>
              {isLoggedIn ? (
                <>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleProfile}
                  >
                    Profile
                  </button>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleCollection}
                  >
                    My Collection
                  </button>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleWishlist}
                  >
                    Wanted For Collection
                  </button>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleLogin}
                  >
                    Login
                  </button>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleRegister}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Container>

      {/* mobile offcanvas */}
      <Offcanvas
        show={show}
        onHide={() => setShow(false)}
        placement="end"
        className="custom-offcanvas"
      >
        <Offcanvas.Header>
          <button
            className={styles.closebtn}
            type="button"
            onClick={() => setShow(false)}
          >
            X
          </button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Links handleClose={() => setShow(false)} />
          <div className={styles.authButtonsWrapper}>
            <div className={styles.authButtons}>
              {isLoggedIn ? (
                <>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleProfile}
                  >
                    Profile
                  </button>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleCollection}
                  >
                    My Collection
                  </button>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleWishlist}
                  >
                    Wanted For Collection
                  </button>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleLogin}
                  >
                    Login
                  </button>
                  <button
                    className={styles.authButtonsButton}
                    onClick={handleRegister}
                  >
                    Register
                  </button>
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
