const express = require('express');
const router = express.Router();
const pool = require('../db'); // Assume you have a database pool setup

// Middleware to verify the token and extract user info
const authenticateToken = require('../middleware/authenticateToken');

// Like a movie
router.post('/', authenticateToken, async (req, res) => {
  const { movieId, genre } = req.body;
  const userId = req.user.id; // Extracted from token

  try {
    const result = await pool.query(
      `INSERT INTO likes (user_id, movie_id, genre)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, movie_id, genre) DO NOTHING
       RETURNING *`,
      [userId, movieId, genre]
    );

    if (result.rows.length > 0) {
      res.status(201).json({ liked: true });
    } else {
      res.status(200).json({ liked: false }); // Already liked
    }
  } catch (error) {
    console.error('Error liking movie:', error);
    res.status(500).json({ error: 'Failed to like movie' });
  }
});

// Unlike a movie
router.delete('/', authenticateToken, async (req, res) => {
  const { movieId, genre } = req.body;
  const userId = req.user.id; // Extracted from token

  try {
    const result = await pool.query(
      `DELETE FROM likes
       WHERE user_id = $1 AND movie_id = $2 AND genre = $3
       RETURNING *`,
      [userId, movieId, genre]
    );

    if (result.rowCount > 0) {
      res.status(200).json({ liked: false });
    } else {
      res.status(200).json({ liked: true }); // Not liked
    }
  } catch (error) {
    console.error('Error unliking movie:', error);
    res.status(500).json({ error: 'Failed to unlike movie' });
  }
});

// Check if the user has liked a movie
router.get('/', authenticateToken, async (req, res) => {
  const { movieId, genre } = req.query;
  const userId = req.user.id; // Extracted from token

  try {
    const result = await pool.query(
      `SELECT * FROM likes
       WHERE user_id = $1 AND movie_id = $2 AND genre = $3`,
      [userId, movieId, genre]
    );

    if (result.rows.length > 0) {
      res.status(200).json({ liked: true });
    } else {
      res.status(200).json({ liked: false });
    }
  } catch (error) {
    console.error('Error fetching like status:', error);
    res.status(500).json({ error: 'Failed to fetch like status' });
  }
});

module.exports = router;
