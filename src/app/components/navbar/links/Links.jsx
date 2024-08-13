"use client";

import React, { useState, useEffect } from "react";
import { Nav, NavDropdown } from "react-bootstrap";
import { useRouter } from "next/navigation";
import NavLinks from "@/app/components/navbar/navLinks/navLinks.jsx";
import styles from "./links.module.css";

const Links = ({ handleClose, expanded }) => {
  const [activeLink, setActiveLink] = useState("/");
  const router = useRouter();

  // Update activeLink on mount
  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  // Handle navigation link click
  const handleLinkClick = (path) => {
    setActiveLink(path);
    router.push(path);
    handleClose(); // Close the navbar on mobile
  };

  // Separate genre links for dropdown
  const genreLinks = links.filter((link) => link.path.startsWith("/genre"));
  const otherLinks = links.filter((link) => !link.path.startsWith("/genre"));

  return (
    <Nav className={styles.links}>
      {otherLinks.map((link) => (
        <NavLinks
          key={link.title}
          item={link}
          className={`${styles.navLink} ${activeLink === link.path ? styles.active : ""}`}
          onClick={() => handleLinkClick(link.path)}
        />
      ))}

      {/* Dropdown for Genre */}
      <NavDropdown
        title="Genre"
        id="genre-dropdown"
        className={styles.navDropdown}
      >
        {genreLinks.map((link) => (
          <NavDropdown.Item
            key={link.title}
            href={link.path}
            className={activeLink === link.path ? styles.active : ""}
            onClick={() => handleLinkClick(link.path)}
          >
            {link.title}
          </NavDropdown.Item>
        ))}
      </NavDropdown>
    </Nav>
  );
};

export default Links;
