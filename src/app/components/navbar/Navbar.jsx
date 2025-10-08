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

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
      logout();
      window.location.href = "/";
    } catch (err) {
      console.error("Logout error", err);
    }
  };

  const goTo = (path) => {
    if (user?.username) {
      window.location.href = `/profile/${user.username}${path}`;
    }
  };

  const renderAvatar = () => {
    if (user?.avatar_url) {
      return (
        <Image
          src={user.avatar_url}
          alt="User Avatar"
          width={40}
          height={40}
          className={styles.avatarImage}
        />
      );
    }
    return (
      <div className={styles.avatarFallback}>
        {user?.username?.charAt(0).toUpperCase()}
      </div>
    );
  };

  const AuthDropdown = () => (
    <Dropdown align="end">
      <Dropdown.Toggle as="div" className={styles.avatarToggle}>
        {renderAvatar()}
      </Dropdown.Toggle>
      <Dropdown.Menu>
        <Dropdown.Item onClick={() => goTo("")}>Profile</Dropdown.Item>
        <Dropdown.Item onClick={() => goTo("/mycollection")}>My Collection</Dropdown.Item>
        <Dropdown.Item onClick={() => goTo("/wantedformycollection")}>
          Wanted for Collection
        </Dropdown.Item>
        <Dropdown.Item onClick={() => goTo("/seenit")}>Seen It</Dropdown.Item>
        <Dropdown.Divider />
        <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );

  return (
    <Navbar expand="lg" className="navbar-dark">
      <Container>
        {/* Logo */}
        <Navbar.Brand href="/">
          <Image
            src="/images/logo/logo.png"
            alt="Logo"
            width={160}
            height={80}
            className="img-fluid"
          />
        </Navbar.Brand>

        {/* Mobile Toggler */}
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

        {/* Desktop Nav */}
        <div className="d-none d-lg-flex align-items-center gap-3">
          <Links handleClose={() => setShow(false)} />
          {isLoggedIn ? (
            <AuthDropdown />
          ) : (
            <div className={styles.authButtons}>
              <button onClick={() => (window.location.href = "/login")}>Login</button>
              <button onClick={() => (window.location.href = "/register")}>Register</button>
            </div>
          )}
        </div>
      </Container>

      {/* Mobile Offcanvas */}
      <Offcanvas
        show={show}
        onHide={() => setShow(false)}
        placement="end"
        className="custom-offcanvas"
      >
        <Offcanvas.Header>
          <button className={styles.closebtn} type="button" onClick={() => setShow(false)}>
            X
          </button>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Links handleClose={() => setShow(false)} />
          <div className={styles.mobileAuth}>
            {isLoggedIn ? (
              <AuthDropdown />
            ) : (
              <>
                <button onClick={() => (window.location.href = "/login")}>Login</button>
                <button onClick={() => (window.location.href = "/register")}>Register</button>
              </>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </Navbar>
  );
};

export default NavbarComponent;
