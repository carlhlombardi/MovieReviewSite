"use client"; // Ensure this is at the top

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import { Container, Row, Col } from 'react-bootstrap'; // Import Bootstrap components

const SciFiPostPage = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/data/scifimovies');
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
           src={"/images/hero/SciFi.png"} // Use the image URL directly from the database
           alt={"Hero"}      // Alt text for accessibility
           width={1325}
           height={275}
           className="horror-hero img-fluid" // Add a class for fluid image
         />
        </Col>
      </Row>
      {itemsToShow.length > 0 ? (
        <Row>
          {itemsToShow.map(item => (
            <Col key={item.row_id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/sci-fi/${encodeURIComponent(item.url)}`}>
                <div className="image-wrapper">
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
      <style jsx>{`
        .image-wrapper {
          position: relative;
          width: 100%; /* Ensure the wrapper takes full width */
          padding: 2rem; /* Aspect ratio 400x600 => 150% (height/width * 100) */
          overflow: hidden; /* Hide overflow to maintain the aspect ratio */
          display: flex;
          justify-content: center; /* Center image horizontally */
          align-items: center; /* Center image vertically */
        }

        .image-wrapper img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover; /* Cover the area while maintaining aspect ratio */
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .custom-col {
            justify-content: center;
          }
        }

        @media (max-width: 767px) {
          .custom-col {
            justify-content: center;
          }
        }
      `}</style>
    </Container>
  );
};

export default SciFiPostPage;
