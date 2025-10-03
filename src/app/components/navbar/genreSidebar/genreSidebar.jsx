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
    { title: "Adventure", path: "/genre/adventure" },
    { title: "Animation", path: "/genre/animation" },
    { title: "Comedy", path: "/genre/comedy" },
    { title: "Crime", path: "/genre/crime" },
    { title: "Documentary", path: "/genre/documentary" },
    { title: "Drama", path: "/genre/drama" },
    { title: "Family", path: "/genre/family" },
    { title: "Fantasy", path: "/genre/fantasy" },
    { title: "History", path: "/genre/history" },
    { title: "Horror", path: "/genre/horror" },
    { title: "Music", path: "/genre/music" },
    { title: "Mystery", path: "/genre/mystery" },
    { title: "Romance", path: "/genre/romance" },
    { title: "Science Fiction", path: "/genre/sciencefiction" },
    { title: "Thriller", path: "/genre/thriller" },
    { title: "Made For TV Movie", path: "/genre/tvmovie" },
    { title: "War", path: "/genre/war" },
    { title: "Western", path: "/genre/western" }
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
