'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useParams, useRouter } from 'next/navigation';
import styles from './MyCollectionPage.module.css';

export default function MyCollectionPage() {
  const { username } = useParams();
  const router = useRouter();

  const [movies, setMovies] = useState([]);
  const [sortedMovies, setSortedMovies] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('title');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  const isTrue = (val) =>
    val === true || val === 'true' || val === 't' || val === 1 || val === '1';

  const fetchCollection = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/auth/profile/${username}/mycollection`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        router.push('/login');
        return;
      }

      if (!res.ok) {
        throw new Error(`Fetch failed ${res.status}: ${await res.text()}`);
      }

      const json = await res.json();
      const filtered = (json.movies ?? []).filter(
        (m) => isTrue(m.isliked) || isTrue(m.iswatched)
      );

      const deduped = Array.from(new Map(filtered.map((m) => [m.url, m])).values());
      setMovies(deduped);
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError(err.message);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, [username, router]);

  useEffect(() => {
    fetchCollection();
  }, [fetchCollection]);

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
        <h1 className={styles.heroTitle}>{username} Collection</h1>
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
                <div className={`${styles.imagewrapper} position-relative`}>
                  <Image
                    src={decodeURIComponent(item.image_url || '/images/fallback.jpg')}
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
            <p className="text-center">No movies added to collection yet.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
}
