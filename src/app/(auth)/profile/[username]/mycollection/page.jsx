// src/app/(auth)/profile/[username]/mycollection/page.jsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useParams } from 'next/navigation';

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
        const res = await fetch(`/api/profile/${username}/mycollection`);
        if (!res.ok) throw new Error(await res.text());
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

  // Sort movies whenever list or criteria changes
  useEffect(() => {
    const sorted = [...movies].sort((a, b) => {
      const key = sortCriteria;
      const va = (a[key] ?? a.title ?? '').toString();
      const vb = (b[key] ?? b.title ?? '').toString();
      return va.localeCompare(vb);
    });
    setSortedMovies(sorted);
  }, [movies, sortCriteria]);

  if (loading) return <Container className="py-4">Loading…</Container>;
  if (error) return <Container className="py-4">Error: {error}</Container>;

  return (
    <Container className="py-4">
      <h1>{capitalize(username)}’s My Collection</h1>

      <Row className="mt-3 mb-4 text-center">
        <Col>
          <label className="me-2">Sort by:</label>
          {['title', 'genre'].map((criteria) => (
            <Button
              key={criteria}
              variant={sortCriteria === criteria ? 'primary' : 'secondary'}
              onClick={() => setSortCriteria(criteria)}
              className="m-1"
            >
              {capitalize(criteria)}
            </Button>
          ))}
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
                <Image
                  src={item.image_url || '/images/fallback.jpg'}
                  alt={item.title}
                  width={200}
                  height={300}
                  className="img-fluid rounded"
                />
                <p className="mt-2 text-center">{item.title}</p>
              </Link>
            </Col>
          ))
        ) : (
          <Col>
            <p className="text-center">No movies in your collection.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
}
