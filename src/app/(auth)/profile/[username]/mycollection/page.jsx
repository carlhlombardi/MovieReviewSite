'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import styles from './MyCollectionPage.module.css'; // optional CSS

export default function MyCollectionPage() {
  const { username } = useParams();
  const [movies, setMovies] = useState([]);
  const [sortedMovies, setSortedMovies] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('title');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const capitalize = (str) =>
    str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  useEffect(() => {
    if (!username) return;

    const fetchCollection = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ get token from localStorage (or cookie if you store it differently)
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No auth token found. Please log in.');
        }

        // ✅ fetch from the protected API route
        const res = await fetch(`/api/auth/profile/${username}/mycollection`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Fetch failed ${res.status}: ${await res.text()}`);
        }

        const json = await res.json();
        setMovies(json.movies ?? []);
      } catch (err) {
        console.error('Error fetching mycollection:', err);
        setError(err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCollection();
  }, [username]);

  // Sort movies whenever movies or sortCriteria changes
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
        <h1 className={styles.heroTitle}>
          My Collection
        </h1>
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
            <Col key={item.url} xs={12} sm={6} md={4} lg={3} className="mb-4">
              <Link
                href={`/movie/${encodeURIComponent(item.url)}`}
                className="text-decoration-none"
              >
                <div className={styles.imagewrapper}>
                  <Image
                    src={item.image_url || '/images/fallback.jpg'}
                    alt={item.title}
                    width={200}
                    height={300}
                    className="img-fluid rounded"
                  />
                </div>
                <p className="mt-2 text-center">{item.title}</p>
              </Link>
            </Col>
          ))
        ) : (
          <Col>
            <p className="text-center">No liked movies yet.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
}
