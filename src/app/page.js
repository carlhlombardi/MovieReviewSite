"use client";

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Container, Row, Col, Form } from 'react-bootstrap';

const Home = () => {
  const [horrorData, setHorrorData] = useState([]);
  const [sciFiData, setSciFiData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch horror + sci-fi data
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

  // Fetch suggestions as user types
  const handleInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/suggest?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Suggestion fetch error:', err);
      setSuggestions([]);
    }
  };

  // User clicked a suggestion
  const fetchMovieById = async (movieId) => {
    try {
      // Fetch movie details
      const movieRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
      const movie = await movieRes.json();
  
      // Fetch credits to get director and stars
      const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`);
      const credits = await creditsRes.json();
  
      const director = credits.crew?.find(p => p.job === 'Director')?.name || 'Unknown';
      const stars = credits.cast?.slice(0, 3).map(c => c.name).join(', ') || 'N/A';
  
      return {
        title: movie.title,
        year: movie.release_date?.slice(0, 4) || 'Unknown',
        director,
        stars,
      };
    } catch (error) {
      console.error('Failed to fetch movie by ID:', error);
      return null;
    }
  };
  
  // When user clicks a suggestion, fetch that exact movie and set it as the only search result
  const handleSuggestionClick = async (movie) => {
    setSearchQuery(movie.title);
    setShowSuggestions(false);
  
    const detailedMovie = await fetchMovieById(movie.id);
    if (detailedMovie) {
      setSearchResults([detailedMovie]);
    } else {
      setSearchResults([]);
    }
  };

  // Manual form submit
  const handleSearch = (e) => {
    e.preventDefault();
    handleSearchDirect(searchQuery);
  };

  // Actually run the search
  const handleSearchDirect = async (query) => {
    if (!query.trim()) return;

    try {
      const res = await fetch(`https://movie-review-site-seven.vercel.app/api/auth/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Movie Search</h1>

      {/* 🔍 Search Input with Suggestions */}
      <Form onSubmit={handleSearch} className="mb-4 position-relative">
        <Form.Control
          type="text"
          placeholder="Search for a movie..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // delay to allow click
        />

        {showSuggestions && suggestions.length > 0 && (
          <ul className="list-group position-absolute w-100 z-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {suggestions.map((movie) => (
              <li
                key={movie.id}
                className="list-group-item list-group-item-action"
                style={{ cursor: 'pointer' }}
                onClick={() => handleSuggestionClick(movie)}
              >
                <strong>{movie.title}</strong> ({movie.year}) – {movie.director}
              </li>
            ))}
          </ul>
        )}
      </Form>

      {/* 🎬 Search Results */}
      {searchResults.length > 0 && (
        <Row className="mb-4 justify-content-center">
          <h2 className="text-center">Search Results</h2>
          {searchResults.map((movie, index) => (
            <Col key={index} xs={12} md={8} lg={6}>
              <div className="p-3 border rounded mb-3">
                <p><strong>Title:</strong> {movie.title}</p>
                <p><strong>Year:</strong> {movie.year}</p>
                <p><strong>Director:</strong> {movie.director}</p>
                <p><strong>Stars:</strong> {movie.stars}</p>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Home;