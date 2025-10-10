'use client';
import { Row, Col } from 'react-bootstrap';
import Link from 'next/link';
import Image from 'next/image';
import styles from './MovieList.module.css';

export default function MovieList({ movies = [] }) {
  if (!movies || movies.length === 0) {
    return <p className="text-center text-muted my-3">No movies to show.</p>;
  }

  return (
    <Row>
      {movies.map((movie) => (
        <Col
          key={movie.tmdb_id ?? movie.id}
          xs={6} sm={4} md={3} lg={2}
          className="mb-4 text-center"
        >
          <Link
            href={`/genre/${movie.genre}/${encodeURIComponent(movie.url)}`}
            className={`${styles.cardLink} text-decoration-none d-block h-100`}
          >
            <div className={styles.imageWrapper}>
              <Image
                src={
                  movie.image_url
                    ? decodeURIComponent(movie.image_url)
                    : '/images/fallback.jpg'
                }
                alt={movie.film}
                width={200}
                height={300}
                className="img-fluid rounded"
              />
            </div>
            <p className="mt-2 text-light small">{movie.film}</p>
          </Link>
        </Col>
      ))}
    </Row>
  );
}
