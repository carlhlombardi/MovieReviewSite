"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import styles from './GenrePage.module.css'; // make sure this matches actual file

const GenrePage = () => {
  const { genre } = useParams();
  const [data, setData] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('film');  // default to film
  const [sortedItems, setSortedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  useEffect(() => {
const fetchGenreData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/data/${genre}`);
      if (!res.ok) {
        throw new Error(`Fetch failed ${res.status}: ${await res.text()}`);
      }
      const json = await res.json();
      console.log("Fetched genre data:", json);

      const movies = Array.isArray(json) ? json : json.movies ?? [];
      setData(movies);
    } catch (err) {
      console.error("Error fetching genre data:", err);
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  if (genre) fetchGenreData();
}, [genre]);

  useEffect(() => {
    const sorted = [...data].sort((a, b) => {
      // Determine the key to compare
      const key = sortCriteria;

      // Safely get value from either a[key] or fallback field names
      const va = (a[key] ?? a.film ?? "").toString();
      const vb = (b[key] ?? b.film ?? "").toString();

      // Numeric sorts
      if (key === 'year') {
        return (Number(a.year) || 0) - (Number(b.year) || 0);
      }
      if (key === 'my_rating') {
        return (Number(b.my_rating) || 0) - (Number(a.my_rating) || 0);
      }

      // Default string sort
      return va.localeCompare(vb);
    });

    setSortedItems(sorted);
  }, [data, sortCriteria]);

  const handleSortChange = (event) => {
    setSortCriteria(event.target.value);
  };

  if (loading) {
    return <Container className="py-4"><p>Loading...</p></Container>;
  }
  if (error) {
    return <Container className="py-4"><p>Error: {error}</p></Container>;
  }

  return (
  <Container className="py-4">
    <div className={styles.hero}>
      <h1 className={styles.heroTitle}>{capitalize(genre)} Films</h1>
    </div>

      <Row className="mt-3 mb-4 text-center">
        <Col>
          <label className="me-2">Sort by:</label>
          <div className="d-flex flex-wrap justify-content-center">
            {['film', 'year', 'studio', 'my_rating'].map((criteria) => (
              <Button
                key={criteria}
                variant={sortCriteria === criteria ? "primary" : "secondary"}
                onClick={() => handleSortChange({ target: { value: criteria } })}
                className={`m-1 ${sortCriteria === criteria ? "active" : ""}`}
              >
                {criteria === 'my_rating' ? 'Rating' : capitalize(criteria)}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      <Row>
 {sortedItems.length > 0 ? (
  sortedItems.map((item) => {
    const key = item.id || item.tmdb_id || item.url;
    const imageSrc = item.image_url && item.image_url.trim() !== "" 
      ? item.image_url 
      : "/images/fallback.jpg";

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
  })
) : (
  <Col><p className="text-center">No movies available in this genre.</p></Col>
)}
      </Row>
    </Container>
  );
};

export default GenrePage;
