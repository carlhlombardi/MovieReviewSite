"use client";

import React, { useState } from 'react';
import { Navbar, Container,  Offcanvas, Nav } from 'react-bootstrap';
import Links from '@/app/components/navbar/links/Links.jsx';
import Image from 'next/image';
import styles from './navbar.module.css';

const NavbarComponent = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

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
        </div>
    </Container>
    <Offcanvas show={show} onHide={handleClose} placement="end" className="custom-offcanvas">
        <Offcanvas.Header>
            <button className={styles.closebtn} type="button" onClick={handleClose}>X</button>
        </Offcanvas.Header>
        <Links handleClose={handleClose} />
    </Offcanvas>
</Navbar>
  );
};

export default NavbarComponent;
