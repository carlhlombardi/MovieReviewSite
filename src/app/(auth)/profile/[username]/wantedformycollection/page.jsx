'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';
import styles from './WantedForMyCollection.module.css';

export default function WantedForMyCollectionPage() {
  const { username } = useParams();
  const router = useRouter();

  const [movies, setMovies] = useState([]);
  const [sortedMovies, setSortedMovies] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('title');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const isWatched = (val) =>
    val === true || val === 'true' || val === 't' || val === 1 || val === '1';

  useEffect(() => {
    if (!username) return;

    const fetchWanted = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ No localStorage, just include cookies
        const res = await fetch(
          `/api/auth/profile/${username}/wantedforcollection`,
          {
            credentials: 'include', // <--- important
          }
        );

        if (res.status === 401) {
          // not logged in, redirect to login
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error(`Fetch failed ${res.status}: ${await res.text()}`);
        }

        const json = await res.json();
        const onlyWatched = (json.movies ?? []).filter((m) =>
          isWatched(m.iswatched ?? m.is_watched ?? m.watched)
        );

        setMovies(onlyWatched);
      } catch (err) {
        console.error('Error fetching wantedforcollection:', err);
        setError(err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWanted();
  }, [username, router]);

  useEffect(() => {
    const sorted = [...movies].sort((a, b) => {
      const key = sortCriteria;
      const va = (a[key] ?? a.title ?? '').toString();
      const vb = (b[key] ?? b.title ?? '').toString();
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
        <h1 className={styles.heroTitle}>Wanted For {username}s Collection</h1>
      </div>

      <Row className="mt-3 mb-4 text-center">
        <Col>
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
        </Col>
      </Row>

      <Row>
        {sortedMovies.length > 0 ? (
          sortedMovies.map((item) => (
            <Col
              key={item.id ?? item.row_id ?? item.url}
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
                    src={decodeURIComponent(
                      item.image_url || '/images/fallback.jpg'
                    )}
                    alt={item.title ?? item.film}
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
            <p className="text-center">No wanted movies yet.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
}
