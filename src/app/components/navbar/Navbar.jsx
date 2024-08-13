"use client";

import React, { useState } from 'react';
import { Navbar, Container } from 'react-bootstrap';
import Links from '@/app/components/navbar/links/Links.jsx';
import Image from 'next/image';

const NavbarComponent = () => {
  const [expanded, setExpanded] = useState(false);

  const handleToggle = () => setExpanded(!expanded);
  const handleClose = () => setExpanded(false);

  return (
    <Navbar expanded={expanded} expand="lg" className="navbar-dark">
      <Container>
        <Navbar.Brand href="/"> 
          <Image
            src={"/images/logo/logo.png"} // Use the image URL directly from the database
            alt={"Logo"}      // Alt text for accessibility
            width={160}
            height={80}
            className='img-fluid'
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" onClick={handleToggle} className= {styles.hamburger} />
        <Navbar.Collapse id="basic-navbar-nav" className= {styles.dropdown-menu}>
          <Links handleClose={handleClose} expanded={expanded} className= {styles.dropdown-item} />
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
