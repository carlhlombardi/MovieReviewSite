"use client";

import { useState, useEffect } from "react";
import { Nav } from "react-bootstrap";
import { useRouter } from "next/navigation";
import NavLinks from "@/app/components/navbar/navLinks/navLinks.jsx";
import styles from "./links.module.css";

const Links = () => {
  const [activeLink, setActiveLink] = useState("/");
  const router = useRouter();

  const links = [
    {
      title: "Home",
      path: "/",
    },
    {
      title: "About",
      path: "/about",
    },
    {
      title: "Contact",
      path: "/contact",
    },
    {
      title: "Horror",
      path: "/genre/horror",
    },
    {
      title: "Sci-Fi",
      path: "/genre/sci-fi",
    },
  ];

  useEffect(() => {
    setActiveLink(window.location.pathname);
  }, []);

  const handleLinkClick = (path) => {
    setActiveLink(path);
    router.push(path);
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
    </Nav>
  );
};

export default Links;
