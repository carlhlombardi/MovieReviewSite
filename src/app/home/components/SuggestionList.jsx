"use client";
import React from "react";

export default function SuggestionList({ suggestions, suggestionsRef, onClick }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
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
          onClick={() => onClick(movie)}
        >
          <strong>{movie.title}</strong> {movie.year ? `(${movie.year})` : ""}
        </li>
      ))}
    </ul>
  );
}
