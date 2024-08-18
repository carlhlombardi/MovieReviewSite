"use client";

import { useState, useEffect } from "react";
import { Nav, Dropdown, Button } from "react-bootstrap";
import { useRouter } from "next/navigation";
import NavLinks from "@/app/components/navbar/navLinks/navLinks.jsx";
import GenreSidebar from "@/app/components/navbar/genreSidebar/genreSidebar.jsx";
import styles from "./links.module.css";

const Links = ({ handleClose, user, onLogout }) => {
  const [activeLink, setActiveLink] = useState("/");
  const [showGenreSidebar, setShowGenreSidebar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();

  const links = [
    { title: "Home", path: "/" },
    { title: "About", path: "/about" },
    { title: "Contact", path: "/contact" },
  ];

  const genreLinks = [
    { title: "Action", path: "/genre/action" },
    { title: "Classic", path: "/genre/classic" },
    { title: "Comedy", path: "/genre/comedy" },
    { title: "Documentaries", path: "/genre/documentary" },
    { title: "Drama", path: "/genre/drama" },
    { title: "Horror", path: "/genre/horror" },
    { title: "Sci-Fi", path: "/genre/sci-fi" },
  ];

  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  const handleLinkClick = (path) => {
    setActiveLink(path);
    router.push(path);
    handleClose(); // Close the navbar
  };

  const toggleGenreSidebar = () => {
    setShowGenreSidebar(!showGenreSidebar);
  };

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
  };

  return (
    <Nav className={styles.links}>
      {links.map((link) => (
        <NavLinks
          key={link.title}
          item={link}
          className={`${styles.navLink} ${activeLink === link.path ? styles.active : ""}`}
          onClick={() => handleLinkClick(link.path)}
        />
      ))}
      <div className={styles.genreButtonWrapper}>
        <div onClick={toggleGenreSidebar} className={styles.dropdownToggle}>
          Genres
        </div>
      </div>
      {showGenreSidebar && <GenreSidebar handleClose={handleClose} />}
      <Dropdown className={styles.genreDropdown} show={showDropdown} onToggle={toggleDropdown}>
        <div className={styles.dropdownToggle} onClick={toggleDropdown}>
          Genres
        </div>
        <Dropdown.Menu className={styles.dropdownMenu}>
          {genreLinks.map((link) => (
            <Dropdown.Item
              key={link.title}
              onClick={() => handleLinkClick(link.path)}
              className={`${styles.dropdownItem} ${activeLink === link.path ? styles.active : ""}`}
            >
              {link.title}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </Nav>
  );
};

export default Links;
