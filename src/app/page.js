"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Container, Form, Row, Col, Card } from "react-bootstrap";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Slugify movie titles for URLs
const slugify = (title, tmdb_id) => {
  return `${title}-${tmdb_id}`
    .toString()
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// Slugify genre names for URLs and table routing
const slugifyGenre = (genre) => {
  return genre.toString().toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
};

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newlyAdded, setNewlyAdded] = useState([]);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch last 5 added movies
  useEffect(() => {
    const fetchNewlyAdded = async () => {
      try {
        const res = await fetch(`${API_URL}/api/data/newlyadded?limit=5`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setNewlyAdded(data.results || []);
      } catch (err) {
        console.error("Could not load newly added movies");
      }
    };
    fetchNewlyAdded();
  }, []);

  // Handle input change and fetch suggestions
  const handleInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/auth/suggest?query=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Suggestion fetch error");
      setSuggestions([]);
    }
  };

  // Hide suggestions on outside click
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

  // Handle suggestion click: fetch details, insert, and redirect
  const handleSuggestionClick = async (movie) => {
    setSearchQuery(movie.title);
    setShowSuggestions(false);

    try {
      const res = await fetch(
        `${API_URL}/api/auth/search?movieId=${encodeURIComponent(movie.id)}`
      );
      if (!res.ok) throw new Error("Failed to fetch movie details");

      const apiResponse = await res.json();
      const movieData = apiResponse.results?.[0];

      if (!movieData || !movieData.title || !movieData.year) {
        alert("Movie data is incomplete.");
        return;
      }

      const genreSlug = slugifyGenre(movieData.genre);
      const slugifiedUrl = slugify(movieData.title, movieData.tmdb_id);

      const insertRes = await fetch(`${API_URL}/api/data/${genreSlug}movies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...movieData,
          url: slugifiedUrl,
        }),
      });

      if (!insertRes.ok) {
        const insertData = await insertRes.json().catch(() => ({}));
        alert(`Failed to insert movie: ${insertData.error || "Unknown error"}`);
        return;
      }

      router.push(`/genre/${genreSlug}/${slugifiedUrl}`);
    } catch (error) {
      console.error("Error adding movie");
      alert("An unexpected error occurred.");
    }
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Movie Search</h1>

      {/* Search Input */}
      <Form className="mb-4 position-relative">
        <Form.Control
          type="text"
          placeholder="Search for a movie..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => searchQuery && setShowSuggestions(true)}
          autoComplete="off"
          ref={inputRef}
        />

        {/* Suggestions Dropdown */}
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
                <strong>{movie.title}</strong> ({movie.year})
              </li>
            ))}
          </ul>
        )}
      </Form>

      {/* Newly Added Section */}
      {newlyAdded.length > 0 && (
        <div>
          <h2 className="mb-3">Newly Added</h2>
          <Row>
            {newlyAdded.map((movie) => (
              <Col key={movie.id} xs={12} md={6} lg={4} className="mb-4">
                <Card onClick={() =>
                    router.push(`/genre/${slugifyGenre(movie.genre)}/${slugify(movie.film, movie.tmdb_id)}`)
                  } style={{cursor:"pointer"}}>
                  <Card.Img variant="top" src={movie.image_url} alt={movie.title}/>
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Container>
  );
}
