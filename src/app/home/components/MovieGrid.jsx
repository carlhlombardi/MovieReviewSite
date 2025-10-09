"use client";
import { Row, Col } from "react-bootstrap";
import MovieCard from "./MovieCard";

export default function MovieGrid({ title, movies }) {
  if (!movies || movies.length === 0) return null;

  return (
    <div>
      <h2 className="mt-3 mb-3 text-center">{title}</h2>
      <Row>
        {movies.map((item) => (
          <Col key={item.id ?? item.url} xs={12} sm={6} md={4} lg={3} className="mb-4">
            <MovieCard movie={item} />
          </Col>
        ))}
      </Row>
    </div>
  );
}
