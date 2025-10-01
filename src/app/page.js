"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Form } from "react-bootstrap";

const Home = () => {
  const router = useRouter();

  const [horrorData, setHorrorData] = useState([]);
  const [sciFiData, setSciFiData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch horror + sci-fi data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching horror and sci-fi data...");
        const horrorResponse = await fetch(
          "https://movie-review-site-seven.vercel.app/api/data/horrormovies"
        );
        const horrorResult = await horrorResponse.json();
        setHorrorData(horrorResult);
        console.log("Horror data fetched:", horrorResult);

        const sciFiResponse = await fetch(
          "https://movie-review-site-seven.vercel.app/api/data/scifimovies"
        );
        const sciFiResult = await sciFiResponse.json();
        setSciFiData(sciFiResult);
        console.log("Sci-Fi data fetched:", sciFiResult);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Handle search input changes & fetch suggestions
  const handleInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    console.log("Input changed:", query);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(
        `https://movie-review-site-seven.vercel.app/api/auth/suggest?query=${encodeURIComponent(
          query
        )}`
      );
      const data = await res.json();
      console.log("Suggestions fetched:", data.results);
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Suggestion fetch error:", err);
      setSuggestions([]);
    }
  };

  // Handle click outside input and suggestions to hide suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // When user clicks a suggestion: add movie to DB and redirect
  const handleSuggestionClick = async (movie) => {
    console.log("Suggestion clicked:", movie);
    setSearchQuery(movie.title);
    setShowSuggestions(false);

    try {
      const res = await fetch(
        `https://movie-review-site-seven.vercel.app/api/auth/search?movieId=${movie.id}`
      );
      if (!res.ok) throw new Error(`Failed to fetch movie details: ${res.statusText}`);

      const data = await res.json();
      console.log("Detailed movie data fetched:", data);

      const movieData = data.results?.[0];
      if (!movieData) {
        alert("Movie details not found.");
        return;
      }

      const {
        title,
        year,
        director,
        screenwriters,
        producers,
        studios,
        run_time,
        genre,
        url,
      } = movieData;

      console.log("Inserting movie:", movieData);

      const insertRes = await fetch(
        `https://movie-review-site-seven.vercel.app/api/data/${genre.toLowerCase()}movies`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            year,
            director,
            screenwriters,
            producers,
            studios,
            run_time,
            genre,
            url,
          }),
        }
      );

      const insertData = await insertRes.json();

      console.log("Insert response:", insertData);

      if (!insertRes.ok) {
        alert(`Failed to insert movie: ${insertData.error || insertData.message}`);
        return;
      }

      router.push(`/genre/${genre.toLowerCase()}/${url}`);
    } catch (error) {
      console.error("Error in handleSuggestionClick:", error);
      alert("An unexpected error occurred. Check console.");
    }
  };

  // Manual form submit to run search
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Manual search submitted:", searchQuery);
    handleSearchDirect(searchQuery);
  };

  // Search for movies by exact title
  const handleSearchDirect = async (query) => {
    if (!query.trim()) return;

    try {
      const res = await fetch(
        `https://movie-review-site-seven.vercel.app/api/auth/search?query=${encodeURIComponent(
          query
        )}`
      );
      if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);

      const data = await res.json();
      console.log("Search results:", data.results);
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Movie Search</h1>

      {/* Search Input with Suggestions */}
      <Form onSubmit={handleSearch} className="mb-4 position-relative">
        <Form.Control
          type="text"
          placeholder="Search for a movie..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          autoComplete="off"
          ref={inputRef}
        />

        {showSuggestions && suggestions.length > 0 && (
          <ul
            ref={suggestionsRef}
            className="list-group position-absolute w-100 z-3"
            style={{ maxHeight: "200px", overflowY: "auto" }}
          >
            {suggestions.map((movie) => (
              <li
                key={movie.id}
                className="list-group-item list-group-item-action"
                style={{ cursor: "pointer" }}
                onClick={() => handleSuggestionClick(movie)}
              >
                <strong>{movie.title}</strong> ({movie.year}) – {movie.director}
              </li>
            ))}
          </ul>
        )}
      </Form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Row className="mb-4 justify-content-center">
          <h2 className="text-center">Search Results</h2>
          {searchResults.map((movie, index) => (
            <Col key={index} xs={12} md={8} lg={6}>
              <div className="p-3 border rounded mb-3">
                <p>
                  <strong>Title:</strong> {movie.title}
                </p>
                <p>
                  <strong>Year:</strong> {movie.year}
                </p>
                <p>
                  <strong>Director:</strong> {movie.director}
                </p>
                <p>
                  <strong>Screenwriters:</strong> {movie.screenwriters}
                </p>
                <p>
                  <strong>Producers:</strong> {movie.producers}
                </p>
                <p>
                  <strong>Studio:</strong> {movie.studios}
                </p>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Home;
