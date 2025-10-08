"use client";

import React, { useState } from "react";
import { Navbar, Container, Offcanvas, Dropdown } from "react-bootstrap";
import { useAuth } from "@/app/(auth)/contexts/AuthContext";
import Links from "@/app/components/navbar/links/Links.jsx";
import Image from "next/image";
import styles from "./navbar.module.css";

const NavbarComponent = () => {
  const [show, setShow] = useState(false);
  const { isLoggedIn, user, logout } = useAuth();

  // 🔐 Auth Actions
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      logout();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const handleLogin = () => (window.location.href = "/login");
  const handleRegister = () => (window.location.href = "/register");

  // 📂 Navigation
  const handleProfile = () => window.location.href = `/profile/${user.username}`;
  const handleCollection = () => window.location.href = `/profile/${user.username}/mycollection`;
  const handleWishlist = () => window.location.href = `/profile/${user.username}/wantedformycollection`;
  const handleSeenIt = () => window.location.href = `/profile/${user.username}/seenit`;

  return (
    <Navbar expand="lg" className="navbar-dark">
      <Container>
        {/* LOGO */}
        <Navbar.Brand href="/">
          <Image
            src="/images/logo/logo.png"
            alt="Logo"
            width={160}
            height={80}
            className="img-fluid"
          />
        </Navbar.Brand>

        {/* Mobile toggler */}
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

        {/* Desktop Nav */}
        <div className="d-none d-lg-flex align-items-center">
          <Links handleClose={() => setShow(false)} />

          <div className={styles.authButtonsWrapper}>
            {isLoggedIn ? (
              <>
                <Dropdown align="end">
                  <Dropdown.Toggle className={styles.authButtonsButton}>
                    {user?.username || "Profile"}
                  </Dropdown.Toggle>

                  <Dropdown.Menu>
                    <Dropdown.Item onClick={handleProfile}>Profile</Dropdown.Item>
                    <Dropdown.Item onClick={handleCollection}>My Collection</Dropdown.Item>
                    <Dropdown.Item onClick={handleWishlist}>Wanted for Collection</Dropdown.Item>
                    <Dropdown.Item onClick={handleSeenIt}>Seen It</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <button className={styles.authButtonsButton} onClick={handleLogin}>
                  Login
                </button>
                <button className={styles.authButtonsButton} onClick={handleRegister}>
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </Container>

      {/* Mobile Offcanvas Menu */}
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
            {isLoggedIn ? (
              <>
                <Dropdown align="start" className="w-100">
                  <Dropdown.Toggle className={`${styles.authButtonsButton} w-100`}>
                    {user?.username || "Profile"}
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="w-100">
                    <Dropdown.Item onClick={handleProfile}>Profile</Dropdown.Item>
                    <Dropdown.Item onClick={handleCollection}>My Collection</Dropdown.Item>
                    <Dropdown.Item onClick={handleWishlist}>Wanted for Collection</Dropdown.Item>
                    <Dropdown.Item onClick={handleSeenIt}>Seen It</Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <button className={styles.authButtonsButton} onClick={handleLogin}>
                  Login
                </button>
                <button className={styles.authButtonsButton} onClick={handleRegister}>
                  Register
                </button>
              </>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </Navbar>
  );
};

export default NavbarComponent;
