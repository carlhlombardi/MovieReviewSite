'use client';

import React from 'react';
import styles from '../MyCollectionPage.module.css'; // components folder is one level deeper
import { Button } from 'react-bootstrap';

export default function CollectionHeader({ username, sortCriteria, setSortCriteria }) {
  const capitalize = (str) => (str ? str.charAt(0).toUpperCase() + str.slice(1) : '');

  return (
    <div className={styles.hero}>
      <h1 className={styles.heroTitle}>{username} Collection</h1>

      <div className="mt-3 mb-4 text-center">
        <label className="me-2">Sort by:</label>
        <div className="d-flex flex-wrap justify-content-center">
          {['title', 'genre'].map((criteria) => (
            <Button
              key={criteria}
              variant={sortCriteria === criteria ? 'primary' : 'secondary'}
              onClick={() => setSortCriteria(criteria)}
              className={`m-1 ${sortCriteria === criteria ? 'active' : ''}`}
            >
              {capitalize(criteria)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
