"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Container, Form, Row, Col } from "react-bootstrap";
import styles from "./page.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ✅ Slugify movie title with TMDB ID
const slugify = (title, tmdb_id) => {
  return `${title}-${tmdb_id}`
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

// ✅ Slugify genre for URLs
const slugifyGenre = (genre) => {
  return genre.toString().toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
};

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [newlyAdded, setNewlyAdded] = useState([]);
  const [newlyReviewed, setNewlyReviewed] = useState([]);

  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // 🟡 Fetch last 8 added movies
  useEffect(() => {
    const fetchNewlyAdded = async () => {
      try {
        const res = await fetch(`${API_URL}/api/data/newlyadded?limit=8`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setNewlyAdded(data.results || []);
      } catch {
        console.error("❌ Could not load newly added movies");
      }
    };
    fetchNewlyAdded();
  }, []);

  // 🟡 Fetch last 8 reviewed movies
  useEffect(() => {
    const fetchNewlyReviewed = async () => {
      try {
        const res = await fetch(`${API_URL}/api/data/newlyreviewed?limit=8`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setNewlyReviewed(data.results || []);
      } catch {
        console.error("❌ Could not load newly reviewed movies");
      }
    };
    fetchNewlyReviewed();
  }, []);

  // 🟡 Handle input and fetch suggestions
  const handleInputChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/suggest?query=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setSuggestions(data.results || []);
      setShowSuggestions(true);
    } catch {
      console.error("❌ Suggestion fetch error");
      setSuggestions([]);
    }
  };

  // 🟡 Hide suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🟢 Handle suggestion click: fetch TMDB details and insert into allmovies
  const handleSuggestionClick = async (movie) => {
    setSearchQuery(movie.title);
    setShowSuggestions(false);

    try {
      const res = await fetch(`${API_URL}/api/auth/search?movieId=${encodeURIComponent(movie.id)}`);
      if (!res.ok) throw new Error("Failed to fetch movie details");

      const apiResponse = await res.json();
      const movieData = apiResponse.results?.[0];

      if (!movieData || !movieData.title || !movieData.year) {
        alert("Movie data is incomplete.");
        return;
      }

      const year = Number(movieData.year) || null;
      const genre = movieData.genre || "Unknown";
      const genreSlug = slugifyGenre(genre);
      const slugifiedUrl = slugify(movieData.title, movieData.tmdb_id);

      const payload = {
        film: movieData.title,
        year,
        tmdb_id: movieData.tmdb_id,
        run_time: movieData.run_time || null,
        screenwriters: movieData.screenwriters || "",
        producer: movieData.producer || "",
        image_url: movieData.image_url || "/images/fallback.jpg",
        genre: genre,
        url: slugifiedUrl,
        studio: movieData.studio || "",
        director: movieData.director || "",
      };

      console.log("📦 Inserting movie:", payload);

      const insertRes = await fetch(`${API_URL}/api/data/allmovies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!insertRes.ok) {
        const insertData = await insertRes.json().catch(() => ({}));
        alert(`Failed to insert movie: ${insertData.error || "Unknown error"}`);
        return;
      }

      router.push(`/genre/${genreSlug}/${slugifiedUrl}`);
    } catch (error) {
      console.error("❌ Error adding movie:", error);
      alert("An unexpected error occurred while adding the movie.");
    }
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Movie Search</h1>

      {/* 🔎 Search Input */}
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
                <strong>{movie.title}</strong> {movie.year ? `(${movie.year})` : ""}
              </li>
            ))}
          </ul>
        )}
      </Form>

      {/* 🟡 Newly Added Section */}
      {newlyAdded.length > 0 && (
        <div>
          <h2 className="mt-3 mb-3 text-center">Newly Added Films</h2>
          <Row>
            {newlyAdded.map((item) => (
              <Col key={item.id ?? item.url} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <Link
                  href={`/genre/${slugifyGenre(item.genre)}/${slugify(item.film, item.tmdb_id)}`}
                  className="text-decoration-none"
                >
                  <div className={`${styles.imagewrapper} position-relative`}>
                    <Image
                      src={decodeURIComponent(item.image_url || "/images/fallback.jpg")}
                      alt={item.film}
                      width={200}
                      height={300}
                      className="img-fluid rounded"
                    />
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        </div>
      )}

      {/* 🟡 Newly Reviewed Section */}
      {newlyReviewed.length > 0 && (
        <div>
          <h2 className="mt-3 mb-3 text-center">Newly Reviewed Films</h2>
          <Row>
            {newlyReviewed.map((item) => (
              <Col key={item.id ?? item.url} xs={12} sm={6} md={4} lg={3} className="mb-4">
                <Link
                  href={`/genre/${slugifyGenre(item.genre)}/${slugify(item.film, item.tmdb_id)}`}
                  className="text-decoration-none"
                >
                  <div className={`${styles.imagewrapper} position-relative`}>
                    <Image
                      src={decodeURIComponent(item.image_url || "/images/fallback.jpg")}
                      alt={item.film}
                      width={200}
                      height={300}
                      className="img-fluid rounded"
                    />
                  </div>
                </Link>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Container>
  );
}
