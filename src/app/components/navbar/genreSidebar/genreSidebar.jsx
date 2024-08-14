"use client";

import { useState } from "react";
import { Nav } from "react-bootstrap";
import { useRouter } from "next/navigation";
import styles from "./genreSidebar.module.css";

const GenreSidebar = ({ handleClose }) => {
  const [activeLink, setActiveLink] = useState("/");
  const router = useRouter();

  const genreLinks = [
    { title: "Action", path: "/genre/action" },
    { title: "Classic", path: "/genre/classic" },
    { title: "Comedy", path: "/genre/comedy" },
    { title: "Documentaries", path: "/genre/documentary" },
    { title: "Drama", path: "/genre/drama" },
    { title: "Horror", path: "/genre/horror" },
    { title: "Sci-Fi", path: "/genre/sci-fi" },
  ];

  const handleLinkClick = (path) => {
    setActiveLink(path);
    router.push(path);
    handleClose(); // Close the sidebar
  };

  return (
    <Nav className={styles.genreSidebar}>
      {genreLinks.map((link) => (
        <Nav.Item key={link.title}>
          <Nav.Link
            className={`${styles.navLink} ${activeLink === link.path ? styles.active : ""}`}
            onClick={() => handleLinkClick(link.path)}
          >
            {link.title}
          </Nav.Link>
        </Nav.Item>
      ))}
    </Nav>
  );
};

export default GenreSidebar;
