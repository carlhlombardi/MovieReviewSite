"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useParams, useRouter } from "next/navigation";
import styles from "./SeenIt.module.css";

export default function SeenItPage() {
  const { username } = useParams();
  const router = useRouter();

  const [movies, setMovies] = useState([]);
  const [sortedMovies, setSortedMovies] = useState([]);
  const [sortCriteria, setSortCriteria] = useState("film");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  useEffect(() => {
    if (!username) return;

    const fetchSeenMovies = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(
          `/api/user/movies?username=${encodeURIComponent(username)}`,
          { credentials: "include" }
        );

        if (res.status === 401) {
          router.push("/login");
          return;
        }

        if (!res.ok) {
          throw new Error(`Fetch failed ${res.status}: ${await res.text()}`);
        }

        const userMovies = await res.json();

        // Filter only seen movies
        const seenMovies = userMovies.filter((m) => m.is_seen === true);

        // 👇 Optional: if your user_movies doesn't include film info,
        // you could extend the API to join `allmovies` table.
        // But assuming your API already returns film, genre, url, etc.:
        setMovies(seenMovies);
      } catch (err) {
        console.error("Error fetching seenit:", err);
        setError(err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSeenMovies();
  }, [username, router]);

  useEffect(() => {
    const sorted = [...movies].sort((a, b) => {
      const key = sortCriteria;
      const va = (a[key] ?? "").toString();
      const vb = (b[key] ?? "").toString();
      return va.localeCompare(vb);
    });
    setSortedMovies(sorted);
  }, [movies, sortCriteria]);

  if (loading) {
    return (
      <Container className="py-4">
        <p>Loading…</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-4">
        <p>Error: {error}</p>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <div className={styles.hero}>
        <h1 className={styles.heroTitle}>Movies {username} Has Seen</h1>
      </div>

      <Row className="mt-3 mb-4 text-center">
        <Col>
          <label className="me-2">Sort by:</label>
          <div className="d-flex flex-wrap justify-content-center">
            {["film", "genre"].map((criteria) => (
              <Button
                key={criteria}
                variant={sortCriteria === criteria ? "primary" : "secondary"}
                onClick={() => setSortCriteria(criteria)}
                className={`m-1 ${sortCriteria === criteria ? "active" : ""}`}
              >
                {capitalize(criteria)}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      <Row>
        {sortedMovies.length > 0 ? (
          sortedMovies.map((item) => (
            <Col
              key={item.tmdb_id ?? item.id}
              xs={12}
              sm={6}
              md={4}
              lg={3}
              className="mb-4"
            >
              <Link
                href={`/genre/${item.genre}/${encodeURIComponent(item.url)}`}
                className="text-decoration-none"
              >
                <div className={styles.imagewrapper}>
                  <Image
                    src={
                      item.image_url
                        ? decodeURIComponent(item.image_url)
                        : "/images/fallback.jpg"
                    }
                    alt={item.film}
                    width={200}
                    height={300}
                    className="img-fluid rounded"
                  />
                </div>
              </Link>
            </Col>
          ))
        ) : (
          <Col>
            <p className="text-center">No movies marked as seen yet.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
}
