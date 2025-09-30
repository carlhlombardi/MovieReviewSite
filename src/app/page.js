"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const Home = () => {
  const [horrorData, setHorrorData] = useState([]);
  const [sciFiData, setSciFiData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const horrorResponse = await fetch('https://movie-review-site-seven.vercel.app/api/data/horrormovies');
        const horrorResult = await horrorResponse.json();
        setHorrorData(horrorResult);

        const sciFiResponse = await fetch('https://movie-review-site-seven.vercel.app/api/data/scifimovies');
        const sciFiResult = await sciFiResponse.json();
        setSciFiData(sciFiResult);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const horrorItemsToShow = horrorData.filter(item => [136, 137, 138, 139].includes(item.id));
  const sciFiItemsToShow = sciFiData.slice(0, 4);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
  
    try {
      const res = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <Container>
      {/* 🔍 Search Bar */}
      <Form onSubmit={handleSearch} className="my-4">
        <Form.Group controlId="searchQuery">
          <Form.Control
            type="text"
            placeholder="Search TMDB for a movie..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </Form.Group>
        <Button type="submit" variant="primary" className="mt-2">Search</Button>
      </Form>

     {/* 🎬 Search Results */}
{searchResults.length > 0 && (
  <Row className="mb-4 justify-content-center">
    <h2 className="text-center">Search Results</h2>
    {searchResults.map((movie, index) => (
      <Col key={index} xs={12} md={8} lg={6}>
        <div className="p-3 border rounded mb-3 bg-light">
          <p><strong>Title:</strong> {movie.title}</p>
          <p><strong>Year:</strong> {movie.year}</p>
          <p><strong>Director:</strong> {movie.director}</p>
          <p><strong>Stars:</strong> {movie.stars}</p>
        </div>
      </Col>
    ))}
  </Row>
)}

      {/* 🧟 Horror Section */}
      {horrorItemsToShow.length > 0 && (
        <Row>
          <h1 className='mt-4 mb-3 text-center'>Top Reviews In Horror</h1>
          {horrorItemsToShow.map(item => (
            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/horror/${encodeURIComponent(item.url)}`}>
                <div className="image-wrapper">
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
      )}

      {/* 🚀 Sci-Fi Section */}
      {sciFiItemsToShow.length > 0 && (
        <Row className='mt-4'>
          <h1 className='mb-3 text-center'>Top Reviews In Sci-Fi</h1>
          {sciFiItemsToShow.map(item => (
            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/sci-fi/${encodeURIComponent(item.url)}`}>
                <div className="image-wrapper">
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
      )}

      <style jsx>{`
        .image-wrapper {
          position: relative;
          width: 100%;
          padding: 2rem;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .image-wrapper img {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (min-width: 768px) and (max-width: 1024px),
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