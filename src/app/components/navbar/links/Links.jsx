"use client";

import { useState, useEffect } from "react";
import { Nav, Dropdown, Button } from "react-bootstrap";
import { useRouter } from "next/navigation";
import NavLinks from "@/app/components/navbar/navLinks/navLinks.jsx";
import GenreSidebar from "@/app/components/navbar/genreSidebar/genreSidebar.jsx";
import styles from "./links.module.css";

const Links = ({ handleClose }) => {
  const [activeLink, setActiveLink] = useState("/");
  const [showGenreSidebar, setShowGenreSidebar] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [user, setUser] = useState(null); // State to manage user authentication
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
    // Function to fetch user data
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const response = await fetch('https://movie-review-site-seven.vercel.app/api/auth/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            setUser(data.username);
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    fetchUserData();
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

  const handleLogin = () => {
    router.push('/login'); // Redirect to the login page
  };

  const handleRegister = () => {
    router.push('/register'); // Redirect to the registration page
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/'); // Redirect to home or a specific page after logout
  };

  const handleSuccessfulLogin = (username) => {
    setUser(username); // Update user state on successful login
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
      <div className={styles.authButtons}>
        {user ? (
          <Button variant="outline-danger" onClick={handleLogout} className={styles.authButton}>Logout</Button>
        ) : (
          <>
            <Button variant="outline-primary" onClick={handleLogin} className={`${styles.authButton} me-2`}>Login</Button>
            <Button variant="outline-secondary" onClick={handleRegister} className={styles.authButton}>Register</Button>
          </>
        )}
      </div>
    </Nav>
  );
};

export default Links;
