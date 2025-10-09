"use client";
import { Form } from "react-bootstrap";

export default function SearchBar({ searchQuery, handleInputChange, inputRef, onFocus }) {
  return (
    <Form className="mb-4 position-relative">
      <Form.Control
        type="text"
        placeholder="Search for a movie..."
        value={searchQuery}
        onChange={handleInputChange}
        onFocus={onFocus}
        autoComplete="off"
        ref={inputRef}
      />
    </Form>
  );
}
