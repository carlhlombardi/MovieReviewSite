"use client";

import { useState, useMemo } from "react";
import { Container } from "react-bootstrap";
import { useParams } from "next/navigation";
import { useCollection } from "./hooks/useCollection";
import CollectionHero from "./components/CollectionHero";
import CollectionSortBar from "./components/CollectionSortBar";
import CollectionGrid from "./components/CollectionGrid";

export default function MyCollectionPage() {
  const { username } = useParams();
  const { movies, loading, error } = useCollection(username);
  const [sortCriteria, setSortCriteria] = useState("film");

  const sortedMovies = useMemo(() => {
    return [...movies].sort((a, b) => {
      const va = (a[sortCriteria] ?? "").toString();
      const vb = (b[sortCriteria] ?? "").toString();
      return va.localeCompare(vb);
    });
  }, [movies, sortCriteria]);

  if (loading)
    return (
      <Container className="py-4">
        <p>Loading…</p>
      </Container>
    );

  if (error)
    return (
      <Container className="py-4">
        <p>Error: {error}</p>
      </Container>
    );

  return (
    <Container className="py-4">
      <CollectionHero username={username} />
      <CollectionSortBar
        sortCriteria={sortCriteria}
        setSortCriteria={setSortCriteria}
      />
      <CollectionGrid movies={sortedMovies} />
    </Container>
  );
}
