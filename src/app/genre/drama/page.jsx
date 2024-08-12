"use client"; // Ensure this is at the top

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import { Container, Row, Col } from 'react-bootstrap'; // Import Bootstrap components
import styles from "./drama.module.css";

const DramaPostPage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/data/dramamovies');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Select the first six items if data is available
  const itemsToShow = data
    .filter(item => item.id >= 1 && item.id <= 139)
    .sort((a, b) => a.id - b.id);

  return (
    <Container>
      <Row>
      <Col>
           <Image
           src={"/images/hero/Drama.jpg"} // Use the image URL directly from the database
           alt={"Hero"}      // Alt text for accessibility
           width={1325}
           height={275}
           className="img-fluid" // Add a class for fluid image
         />
        </Col>
      </Row>
      {itemsToShow.length > 0 ? (
        <Row>
          {itemsToShow.map(item => (
            <Col key={item.row_id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/drama/${encodeURIComponent(item.url)}`}>
                <div className={styles.image-wrapper}>
                  <Image
                    src={decodeURIComponent(item.image_url)} // Use the image URL directly from the database
                    alt={item.Film}      // Alt text for accessibility
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

export default DramaPostPage;
