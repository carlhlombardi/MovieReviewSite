"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { useParams } from 'next/navigation';
import styles from './GenrePage.module.css'; // ✅ Rename your CSS file to match

const GenrePage = () => {
  const { genre } = useParams(); // Get genre from dynamic route
  const [data, setData] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('id');
  const [sortedItems, setSortedItems] = useState([]);

  // Capitalize helper
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  // ✅ Fetch data on genre change
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`https://movie-review-site-seven.vercel.app/api/data/${genre}movies`);
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Error fetching genre data:", error);
      }
    };

    if (genre) {
      fetchData();
    }
  }, [genre]);

  // ✅ Sort on data or sortCriteria change
  useEffect(() => {
    const sorted = data
      .filter(item => item.id >= 1 && item.id <= 160) // Optional range filter
      .sort((a, b) => {
        if (sortCriteria === 'title') return a.title.localeCompare(b.title);
        if (sortCriteria === 'year') return a.year - b.year;
        if (sortCriteria === 'studios') return a.studios.localeCompare(b.studios);
        if (sortCriteria === 'my_rating') return (b.my_rating || 0) - (a.my_rating || 0);
        return 0;
      });
    setSortedItems(sorted);
  }, [data, sortCriteria]);

  const handleSortChange = (event) => {
    setSortCriteria(event.target.value);
  };

  return (
    <Container className="py-4">
      {/* 🖼️ Hero image */}
      <Row>
        <Col>
          <Image
            src={`/images/hero/${capitalize(genre)}.jpg`}
            alt={`${capitalize(genre)} Hero`}
            width={1325}
            height={275}
            className="img-fluid"
            priority
          />
        </Col>
      </Row>

      {/* 🔀 Sorting */}
      <Row className="mt-3 mb-4 text-center">
        <Col>
          <label className="me-2">Sort by:</label>
          <div className="d-flex flex-wrap justify-content-center">
            {['title', 'year', 'studios', 'my_rating'].map((criteria) => (
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

      {/* 🎞️ Movie cards */}
      <Row>
        {sortedItems.length > 0 ? (
          sortedItems.map((item) =>
            item.url ? (
              <Col key={item.id} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <Link href={`/genre/${genre}/${encodeURIComponent(item.url)}`} className="text-decoration-none">
                  <div className={styles.imagewrapper}>
                    <Image
                      src={decodeURIComponent(item.image_url || "/images/fallback.jpg")}
                      alt={item.title}
                      width={200}
                      height={300}
                      className="img-fluid rounded"
                    />
                    <div className="text-center mt-2">
                      <strong>{item.title}</strong> ({item.year})
                    </div>
                  </div>
                </Link>
              </Col>
            ) : null
          )
        ) : (
          <Col>
            <p className="text-center">No movies available for this genre.</p>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default GenrePage;
