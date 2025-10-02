"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Container, Row, Col, Form } from "react-bootstrap";

// ✅ Slugify function to clean up URLs (also used on MoviePage)
const slugify = (title, year) => {
  return `${title}-${year}`
    .toString()
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};


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

  // ✅ Fetch horror + sci-fi data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const horrorRes = await fetch("/api/data/horrormovies");
        const horrorResult = await horrorRes.json();
        setHorrorData(horrorResult);

        const sciFiRes = await fetch("/api/data/scifimovies");
        const sciFiResult = await sciFiRes.json();
        setSciFiData(sciFiResult);
      } catch (error) {
        console.error("Error fetching genre data:", error);
      }
    };

    fetchData();
  }, []);

  // ✅ Handle input + get suggestions
  const handleInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`/api/auth/suggest?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Suggestion fetch error:", err);
      setSuggestions([]);
    }
  };

  // ✅ Hide suggestions on outside click
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Handle suggestion click: fetch details, insert, redirect
const handleSuggestionClick = async (movie) => {
  setSearchQuery(movie.title);
  setShowSuggestions(false);

  try {
    const res = await fetch(`/api/auth/search?movieId=${movie.id}`);
    if (!res.ok) throw new Error("Failed to fetch movie details");

    const apiResponse = await res.json();

    const movieData = apiResponse.results?.[0];
    console.log("movieData:", movieData);

    if (!movieData || !movieData.title || !movieData.year) {
      console.error("Missing title or year:", movieData);
      alert("Movie data is incomplete.");
      return;
    }

    const slugifiedUrl = slugify(movieData.title, movieData.year);

    const insertRes = await fetch(`/api/data/${movieData.genre.toLowerCase()}movies`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...movieData,
        url: slugifiedUrl,
      }),
    });

    const insertData = await insertRes.json();
    if (!insertRes.ok) {
      alert(`Failed to insert movie: ${insertData.error || insertData.message}`);
      return;
    }

    router.push(`/genre/${movieData.genre.toLowerCase()}/${slugifiedUrl}`);
  } catch (error) {
    console.error("Error in handleSuggestionClick:", error);
    alert("An unexpected error occurred. Check the console.");
  }
};

  // ✅ Manual search submit
  const handleSearch = (e) => {
    e.preventDefault();
    handleSearchDirect(searchQuery);
  };

  // ✅ Search for movies directly by query
  const handleSearchDirect = async (query) => {
    if (!query.trim()) return;

    try {
      const res = await fetch(`/api/auth/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);

      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Movie Search</h1>

      {/* 🔍 Search Input */}
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

        {/* 💡 Suggestions Dropdown */}
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

      {/* 📋 Optional Search Results if manual search is used */}
      {searchResults.length > 0 && (
        <Row className="mb-4 justify-content-center">
          <h2 className="text-center">Search Results</h2>
          {searchResults.map((movie, index) => (
            <Col key={index} xs={12} md={8} lg={6}>
              <div className="p-3 border rounded mb-3">
                <p><strong>Title:</strong> {movie.title}</p>
                <p><strong>Year:</strong> {movie.year}</p>
                <p><strong>Director:</strong> {movie.director}</p>
                <p><strong>Screenwriters:</strong> {movie.screenwriters}</p>
                <p><strong>Producers:</strong> {movie.producers}</p>
                <p><strong>Studio:</strong> {movie.studios}</p>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
};

export default Home;
