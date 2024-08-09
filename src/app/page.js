"use client"; // Ensure this is at the top

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import { Container, Row, Col } from 'react-bootstrap'; // Import Bootstrap components

const Home = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://movie-review-site-seven.vercel.app/api/data');
        const result = await response.json();
        console.log(result); // Log the fetched data
        setData(result);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // Filter the data to show items with IDs 1, 2, and 3
  const itemsToShow = data.filter(item => [1, 2, 3].includes(item.id));
  console.log(itemsToShow); // Log the filtered items

  return (
    <Container>
      {itemsToShow.length > 0 ? (
        <Row>
          <h1 className='mt-4 mb-3 text-center'>Newest Reviews In Horror</h1>
          {itemsToShow.map(item => (
            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/horror/${encodeURIComponent(item.url)}`}>
                <div className="image-wrapper">
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
