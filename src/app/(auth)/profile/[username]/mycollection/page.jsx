"use client";

import { useState, useMemo } from "react";
import { Container } from "react-bootstrap";
import { useParams } from "next/navigation";

import { useCollection } from "./hooks/useCollection";
import CollectionHeader from "./components/CollectionHeader";
import MovieGrid from "./components/MovieGrid";
import Loading from "./components/Loading";
import ErrorMessage from "./components/Error";

export default function MyCollectionPage() {
  const { username } = useParams();
  const { movies, loading, error } = useCollection(username);
  const [sortCriteria, setSortCriteria] = useState("title");

  // Sorting inline like SeenItPage
  const sortedMovies = useMemo(() => {
    return [...movies].sort((a, b) => {
      const va = (a[sortCriteria] ?? "").toString();
      const vb = (b[sortCriteria] ?? "").toString();
      return va.localeCompare(vb);
    });
  }, [movies, sortCriteria]);

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <Container className="py-4">
      <CollectionHeader
        username={username}
        sortCriteria={sortCriteria}
        setSortCriteria={setSortCriteria}
      />

      {sortedMovies.length > 0 ? (
        <MovieGrid movies={sortedMovies} />
      ) : (
        <p className="text-center">No movies added to collection yet.</p>
      )}
    </Container>
  );
}
