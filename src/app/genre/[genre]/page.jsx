"use client";

import { Container } from "react-bootstrap";
import { useParams } from "next/navigation";
import styles from "./GenrePage.module.css";

import GenreHero from "./components/GenreHero";
import GenreSortControls from "./components/GenreSortControls";
import GenreMovieGrid from "./components/GenreMovieGrid";
import useGenreData from "./hooks/useGenreData";
import useGenreSort from "./hooks/useGenreSort";

export default function GenrePage() {
  const { genre } = useParams();
  const { data, loading, error } = useGenreData(genre);
  const { sortedItems, sortCriteria, setSortCriteria } = useGenreSort(data);

  if (loading) return <Container className="py-4"><p>Loading...</p></Container>;
  if (error) return <Container className="py-4"><p>Error: {error}</p></Container>;

  return (
    <Container className="py-4">
      <GenreHero genre={genre} />
      <GenreSortControls sortCriteria={sortCriteria} setSortCriteria={setSortCriteria} />
      <GenreMovieGrid genre={genre} movies={sortedItems} />
    </Container>
  );
}
