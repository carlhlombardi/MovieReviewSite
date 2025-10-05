'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import styles from './WantedForMyCollection.module.css';

export default function WantedForMyCollectionPage() {
  const { username } = useParams();
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

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('401'); // signal no token
        }

        const res = await fetch(
          `/api/auth/profile/${username}/wantedforcollection`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.status === 401) {
          throw new Error('401');
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
        // store just "401" so we know it's an auth error
        setError(err.message === '401' ? '401' : err.message);
        setMovies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchWanted();
  }, [username]);

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

  // show special 401 page
  if (error === '401') {
    return (
      <Container className="py-4 text-center">
        <div>
          <h2>401 Error!!</h2>
          <h3>Please Log In</h3>
          <Link href="/login">
            <Button className={styles.authButtonsButton}>
              Go to Login
            </Button>
          </Link>
        </div>
      </Container>
    );
  }

  // show generic error
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
        <h1 className={styles.heroTitle}>Wanted For My Collection</h1>
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
