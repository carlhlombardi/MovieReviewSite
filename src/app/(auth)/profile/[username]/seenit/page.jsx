"use client";

import { useState, useMemo } from "react";
import { Container } from "react-bootstrap";
import { useParams } from "next/navigation";
import { useSeenIt } from "@/hooks/useSeenIt";
import SeenItHero from "@/components/SeenIt/SeenItHero";
import SeenItSortBar from "@/components/SeenIt/SeenItSortBar";
import SeenItGrid from "@/components/SeenIt/SeenItGrid";

export default function SeenItPage() {
  const { username } = useParams();
  const { movies, loading, error } = useSeenIt(username);
  const [sortCriteria, setSortCriteria] = useState("film");

  const sortedMovies = useMemo(() => {
    return [...movies].sort((a, b) => {
      const va = (a[sortCriteria] ?? "").toString();
      const vb = (b[sortCriteria] ?? "").toString();
      return va.localeCompare(vb);
    });
  }, [movies, sortCriteria]);

  if (loading) return <Container className="py-4"><p>Loading…</p></Container>;
  if (error) return <Container className="py-4"><p>Error: {error}</p></Container>;

  return (
    <Container className="py-4">
      <SeenItHero username={username} />
      <SeenItSortBar sortCriteria={sortCriteria} setSortCriteria={setSortCriteria} />
      <SeenItGrid movies={sortedMovies} />
    </Container>
  );
}
