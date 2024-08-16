"use client";

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import Image from 'next/image';
import Comments from '@/app/components/comments/comments';

const fetchData = async (url) => {
  try {
    const response = await fetch('https://movie-review-site-seven.vercel.app/api/data/horrormovies');
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
    const data = await response.json();
    const filteredData = data.filter(item => item.url === url);
    return filteredData.length > 0 ? filteredData[0] : null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const Page = ({ params }) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDataAsync = async () => {
      try {
        const result = await fetchData(params.url);
        setData(result);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDataAsync();
  }, [params.url]);

  if (isLoading) {
    return <Spinner animation="border" />;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!data) {
    return <div>No data found</div>;
  }

  const { film, year, studio, director, screenwriters, producer, total_kills, men, women, run_time, my_rating, review, image_url } = data;

  return (
    <Container>
      <Row>
        <Col xs={12} md={6} className="text-center order-md-2 mt-5 mb-3">
          <div className="image-wrapper">
            {image_url ? (
              <Image
                src={image_url}
                alt={film}
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
          <h5>Screenwriter(s): {screenwriters}</h5>
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
          <h3 className='mb-4'>Review of {film}</h3>
          <p>{review}</p>
          <h3>My Rating: {my_rating} Stars</h3>
        </Col>
        </Row>
        <Row>
        <Col xs={12} className="mt-5">
          <Comments movieUrl={params.url} />
        </Col>
      </Row>
    </Container>
  );
};

export default Page;
