"use client";

import { Row, Col } from "react-bootstrap";
import MovieCard from "../../components/MovieCard";

export default function CollectionGrid({ movies }) {
  if (movies.length === 0) {
    return (
      <Row>
        <Col>
          <p className="text-center">No movies marked as in collection yet.</p>
        </Col>
      </Row>
    );
  }

  return (
    <Row>
      {movies.map((item) => (
        <Col
          key={item.tmdb_id ?? item.id}
          xs={12}
          sm={6}
          md={4}
          lg={3}
          className="mb-4"
        >
          <MovieCard item={item} />
        </Col>
      ))}
    </Row>
  );
}
