"use client";

import { Button } from "react-bootstrap";

export default function CollectionBar({ sortCriteria, setSortCriteria }) {
  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : "";

  return (
    <div className="d-flex flex-wrap justify-content-center mt-3 mb-4">
      {["film", "genre"].map((criteria) => (
        <Button
          key={criteria}
          variant={sortCriteria === criteria ? "primary" : "secondary"}
          onClick={() => setSortCriteria(criteria)}
          className={`m-1 ${sortCriteria === criteria ? "active" : ""}`}
        >
          {capitalize(criteria)}
        </Button>
      ))}
    </div>
  );
}
