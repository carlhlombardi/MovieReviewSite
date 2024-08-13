"use client"; // Ensure this is at the top

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import the Image component
import { Container, Row, Col } from 'react-bootstrap'; // Import Bootstrap components
import styles from "./drama.module.css";

const DramaPostPage = () => {
  const [data, setData] = useState([]);
  const [sortCriteria, setSortCriteria] = useState('film'); // Default sort by title

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

   // Handle sorting
   const sortedItems = data
   .filter(item => item.id >= 1 && item.id <= 139)
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

 // Handle dropdown change
 const handleSortChange = (event) => {
   setSortCriteria(event.target.value);
 };

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
      <Row className="mb-3">
        <Col>
          <label htmlFor="sort">Sort by:</label>
          <select id="sort" value={sortCriteria} onChange={handleSortChange} className="form-select">
            <option value="title">Title</option>
            <option value="year">Year</option>
            <option value="studio">Studio</option>
            <option value="my_rating">Rating</option>
          </select>
        </Col>
      </Row>
      {sortedItems.length > 0 ? (
        <Row>
          {sortedItems.map(item => (
            <Col key={item.row_id} xs={12} sm={6} md={4} lg={3}>
              <Link href={`/genre/drama/${encodeURIComponent(item.url)}`}>
                <div className={styles.imagewrapper}>
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
