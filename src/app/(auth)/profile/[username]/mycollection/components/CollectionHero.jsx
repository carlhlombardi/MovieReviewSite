"use client";

import styles from "../MyCollectionPage.module.css";

export default function CollectionHero({ username }) {
  return (
    <div className={styles.hero}>
      <h1 className={styles.heroTitle}>{username}s Collection</h1>
    </div>
  );
}

