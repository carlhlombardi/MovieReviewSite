"use client"; // Ensure this is at the top

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import { Container, Row, Col } from 'react-bootstrap'; // Import Bootstrap components

const Home = () => {
  const [horrorData, setHorrorData] = useState([]);
  const [sciFiData, setSciFiData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch data from horror movies endpoint
        const horrorResponse = await fetch('https://movie-review-site-seven.vercel.app/api/data/horrormovies');
        const horrorResult = await horrorResponse.json();
        setHorrorData(horrorResult);

        // Fetch data from sci-fi movies endpoint
        const sciFiResponse = await fetch('https://movie-review-site-seven.vercel.app/api/data/scifimovies');
        const sciFiResult = await sciFiResponse.json();
        setSciFiData(sciFiResult);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter and combine data
  const horrorItemsToShow = horrorData.filter(item => [136, 137, 138, 139].includes(item.id));
  const sciFiItemsToShow = sciFiData.slice(0, 4); // Get the first 4 sci-fi movies

  return (
    <Container>
      {/* Display Horror Movies */}
      {horrorItemsToShow.length > 0 && (
        <Row>
          <h1 className='mt-4 mb-3 text-center'>Newest Reviews In Horror</h1>
          {horrorItemsToShow.map(item => (
            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/horror/${encodeURIComponent(item.url)}`}>
                <div className="image-wrapper">
                  <Image
                    src={decodeURIComponent(item.image_url)} // Use the image URL directly from the database
                    alt={item.film} // Alt text for accessibility
                    width={200}
                    height={300}
                  />
                </div>
              </Link>
            </Col>
          ))}
        </Row>
      )}

      {/* Display Sci-Fi Movies */}
      {sciFiItemsToShow.length > 0 && (
        <Row className='mt-4'>
          <h1 className='mb-3 text-center'>Sci-Fi Movies</h1>
          {sciFiItemsToShow.map(item => (
            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/scifi/${encodeURIComponent(item.url)}`}>
                <div className="image-wrapper">
                  <Image
                    src={decodeURIComponent(item.image_url)} // Use the image URL directly from the database
                    alt={item.film} // Alt text for accessibility
                    width={200}
                    height={300}
                  />
                </div>
              </Link>
            </Col>
          ))}
        </Row>
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

export default Home;
