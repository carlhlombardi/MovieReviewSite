"use client";

import React, { useState } from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import Links from '@/app/components/navbar/links/Links.jsx';
import Image from 'next/image';
import { Dropdown } from 'react-bootstrap';
import Link from 'next/link';

const NavbarComponent = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Navbar expand="lg" className="navbar-dark">
      <Container>
        <Navbar.Brand href="/"> <Image
                src={"/images/logo/logo.png"} // Use the image URL directly from the database
                alt={"Logo"}      // Alt text for accessibility
                width={160}
                height={16}
              />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
          <Nav className="ml-auto">
            <Links />
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarComponent;
