"use client";

import React, { useState } from 'react';
import { Navbar, Container,  Offcanvas, Button } from 'react-bootstrap';
import Links from '@/app/components/navbar/links/Links.jsx';
import Image from 'next/image';
import styles from './navbar.module.css';

const NavbarComponent = () => {
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Navbar expand="lg" className="navbar-dark">
  <Container>
    <Navbar.Brand href="/"> <Image
            src={"/images/logo/logo.png"} // Use the image URL directly from the database
            alt={"Logo"}      // Alt text for accessibility
            width={160}
            height={80}
            className='img-fluid'
          />
    </Navbar.Brand>
    <button className= {styles.navbartoggler} type="button" onClick={handleShow}>
    <span className={styles.navbartogglericon}>
                    <span className={styles.bar}></span>
                    <span className={styles.bar}></span>
                    <span className={styles.bar}></span>
    </span>
    </button>
    <Offcanvas show={show} onHide={handleClose} backdropClassName={styles.NavBackground}>
    <Offcanvas.Header closeButton />
    <Links handleClose={handleClose}  className={styles.NavLinks} />
  </Offcanvas>
  </Container>
</Navbar>
    </>
  );
};

export default NavbarComponent;
