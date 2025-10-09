"use client";

import styles from "../SeenIt.module.css";

export default function SeenItHero({ username }) {
  return (
    <div className={styles.hero}>
      <h1 className={styles.heroTitle}>Movies {username} Has Seen</h1>
    </div>
  );
}
