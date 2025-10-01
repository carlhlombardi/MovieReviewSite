"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Button } from 'react-bootstrap';
import styles from "./module.css"; // Rename to something generic like page.module.css
import { useParams } from 'next/navigation';

const GenrePage = () => {
  const { genre } = useParams(); // Access dynamic genre route
  const [data, setData] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('id');
  const [sortedItems, setSortedItems] = useState([]);

  // Fetch movie data for the current genre
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`https://movie-review-site-seven.vercel.app/api/data/${genre}movies`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (genre) {
      fetchData();
    }
  }, [genre]);

  // Sort logic
  useEffect(() => {
    const sorted = data
      .filter(item => item.id >= 1 && item.id <= 160)
      .sort((a, b) => {
        if (sortCriteria === 'film') return a.film.localeCompare(b.film);
        if (sortCriteria === 'year') return a.year - b.year;
        if (sortCriteria === 'studio') return a.studio.localeCompare(b.studio);
        if (sortCriteria === 'my_rating') return b.my_rating - a.my_rating;
        return 0;
      });
    setSortedItems(sorted);
  }, [sortCriteria, data]);

  const handleSortChange = (event) => {
    setSortCriteria(event.target.value);
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  return (
    <Container>
      {/* Hero Image */}
      <Row>
        <Col>
          <Image
            src={`/images/hero/${capitalize(genre)}.jpg`}
            alt={`${genre} Hero`}
            width={1325}
            height={275}
            className="img-fluid"
          />
        </Col>
      </Row>

      {/* Sorting Buttons */}
      <Row className="mt-3 mb-3 text-center">
        <Col>
          <label>Sort by:</label>
          <div className="d-flex flex-wrap justify-content-center">
            {['film', 'year', 'studio', 'my_rating'].map(criteria => (
              <Button
                key={criteria}
                variant={sortCriteria === criteria ? "primary" : "secondary"}
                onClick={() => handleSortChange({ target: { value: criteria } })}
                className={`m-1 transparent-button ${sortCriteria === criteria ? "active" : ""}`}
              >
                {criteria === 'my_rating' ? 'Rating' : capitalize(criteria)}
              </Button>
            ))}
          </div>
        </Col>
      </Row>

      {/* Movie Cards */}
      {sortedItems.length > 0 ? (
        <Row>
          {sortedItems.map(item => (
            <Col key={item.row_id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/${genre}/${encodeURIComponent(item.url)}`}>
                <div className={styles.imagewrapper}>
                  <Image
                    src={decodeURIComponent(item.image_url)}
                    alt={item.film}
                    width={200}
                    height={300}
                  />
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      ) : (
        <p>No data available.</p>
      )}
    </Container>
  );
};

export default GenrePage;
