"use client"; // Ensure this is at the top

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import { Container, Row, Col, Button } from 'react-bootstrap'; // Import Bootstrap components
import styles from "./horror.module.css";

const HorrorPostPage = () => {
  const [data, setData] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('id'); // Default sort by id
  const [sortedItems, setSortedItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/data/horrormovies');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const sorted = data
      .filter(item => item.id >= 1 && item.id <= 160)
      .sort((a, b) => {
        if (sortCriteria === 'film') {
          return a.film.localeCompare(b.film); 
        }
        if (sortCriteria === 'year') {
          return a.year - b.year;
        }
        if (sortCriteria === 'studio') {
          return a.studio.localeCompare(b.studio);
        }
        if (sortCriteria === 'my_rating') {
          return b.my_rating - a.my_rating; // Highest rating first
        }
        return 0;
      });
    setSortedItems(sorted);
  }, [sortCriteria, data]);

  // Handle dropdown change
  const handleSortChange = (event) => {
    setSortCriteria(event.target.value);
  };

  return (
    <Container>
      <Row>
        <Col>
          <Image
            src={"/images/hero/Horror.jpg"} // Use the image URL directly from the database
            alt={"Hero"}      // Alt text for accessibility
            width={1325}
            height={275}
            className="img-fluid" // Add a class for fluid image
          />
        </Col>
      </Row>
      <Row className="mb-3">
      <Col xs={12} sm={6}>
      <label>Sort by:</label>
      <div className="d-flex flex-wrap">
        <Button
          variant={sortCriteria === "film" ? "primary" : "secondary"}
          onClick={() => handleSortChange({ target: { value: "film" } })}
          className="m-1"
        >
          Title
        </Button>
        <Button
          variant={sortCriteria === "year" ? "primary" : "secondary"}
          onClick={() => handleSortChange({ target: { value: "year" } })}
          className="m-1"
        >
          Year
        </Button>
        <Button
          variant={sortCriteria === "studio" ? "primary" : "secondary"}
          onClick={() => handleSortChange({ target: { value: "studio" } })}
          className="m-1"
        >
          Studio
        </Button>
        <Button
          variant={sortCriteria === "my_rating" ? "primary" : "secondary"}
          onClick={() => handleSortChange({ target: { value: "my_rating" } })}
          className="m-1"
        >
          Rating
        </Button>
      </div>
    </Col>
      </Row>
      {sortedItems.length > 0 ? (
        <Row>
          {sortedItems.map(item => (
            <Col key={item.row_id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/horror/${encodeURIComponent(item.url)}`}>
                <div className={styles.imagewrapper}>
                  <Image
                    src={decodeURIComponent(item.image_url)} // Use the image URL directly from the database
                    alt={item.film}      // Alt text for accessibility
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

export default HorrorPostPage;
