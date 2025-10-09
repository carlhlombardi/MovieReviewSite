import Link from "next/link";
import Image from "next/image";
import { Row, Col } from "react-bootstrap";
import styles from "../GenrePage.module.css";

export default function GenreMovieGrid({ genre, movies }) {
  if (!movies || movies.length === 0) {
    return <p className="text-center">No movies available in this genre.</p>;
  }

  return (
    <Row>
      {movies.map((item) => {
        const key = item.id || item.tmdb_id || item.url;
        const imageSrc = item.image_url?.trim() ? item.image_url : "/images/fallback.jpg";

        return (
          <Col key={key} xs={12} sm={6} md={4} lg={3} className="mb-4">
            <Link href={`/genre/${genre}/${encodeURIComponent(item.url)}`} className="text-decoration-none">
              <div className={styles.imagewrapper}>
                <Image
                  src={imageSrc}
                  alt={item.film}
                  width={200}
                  height={300}
                  className="img-fluid rounded"
                />
              </div>
            </Link>
          </Col>
        );
      })}
    </Row>
  );
}
