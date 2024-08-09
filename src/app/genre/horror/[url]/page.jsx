"use client";

import React, { useEffect, useState } from 'react';
import {Container, Row, Col } from 'react-bootstrap';
import Image from 'next/image';

// Function to fetch data from the API
const fetchData = async (url) => {
  try {
    const response = await fetch(`https://movie-review-site-seven.vercel.app/api/data`);
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const data = await response.json();
    // Filter data to find the row that matches the URL
    const filteredData = data.filter(item => item.url === url);
    return filteredData.length > 0 ? filteredData[0] : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// Page component that fetches and displays data
const Page = ({ params }) => {
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchDataAsync = async () => {
      const result = await fetchData(params.url);
      setData(result);
    };

    fetchDataAsync();
  }, [params.url]);

  // Handle the case where data might be null or undefined
  if (!data) {
    return <div>No data found</div>;
  }

  // Destructure necessary fields from the fetched data
  const { film, year, studio, director, screenwriter, producer, total_kills, men, women, run_time, my_rating, review,  image_url } = data;

  return (
    <Container>
      <Row>
      <Col xs={12} md={6} className="text-center order-md-2 mt-5 mb-3">
          <div className="image-wrapper">
            {image_url ? (
              <Image
                src={image_url} // Use the image URL directly from the database
                alt={film}      // Alt text for accessibility
                width={300}
                height={450}
              />
            ) : (
              <div>No image available</div>
            )}
          </div>
        </Col>
      <Col xs={12} md={6} className="text-center m-auto order-md-1">
          <h1 className='mb-4'>{film}</h1>
          <h5>Director: {director}</h5>
          <h5>Screenwriter(s): {screenwriter}</h5>
          <h5>Producer(s): {producer}</h5>
          <h5>Studio: {studio}</h5>
          <h5>Year: {year}</h5>
        </Col>
        <Col xs={12} md={6} className="text-center m-auto order-md-3">
          <h2 className='mb-4'>The Stats</h2>
          <h6>Run Time: {run_time} Minutes</h6>
          <h6>Total Kills: {total_kills} Kills</h6>
          <h6>Men: {men} Killed</h6>
          <h6>Women: {women} Killed</h6>
        </Col>
        <Col xs={12} md={6} className="text-center m-auto order-md-4">
          <h2 className='mb-4'>Review of {film}</h2>
          <p>{review}</p>
          <h3>My Rating: {my_rating} Stars</h3>
        </Col>
      </Row>
    </Container>
  );
};

export default Page;
