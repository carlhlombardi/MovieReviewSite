'use client';

import React from 'react';
import { Row, Col } from 'react-bootstrap';
import MovieCard from '../../components/MovieCard';

export default function MovieGrid({ movies }) {
  if (!movies || movies.length === 0) return null;

  return (
    <Row>
      {movies.map((item) => (
        <Col
          key={item.id ?? item.row_id ?? item.url}
          xs={12}
          sm={6}
          md={4}
          lg={3}
          className="mb-4"
        >
          <MovieCard movie={item} />
        </Col>
      ))}
    </Row>
  );
}
