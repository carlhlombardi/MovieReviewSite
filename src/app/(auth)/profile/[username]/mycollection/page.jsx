'use client';

import React from 'react';
import { Container } from 'react-bootstrap';
import { useParams } from 'next/navigation';

import useCollection from './hooks/useCollection';
import useSortedMovies from './hooks/useSortedMovies';
import CollectionHeader from './components/CollectionHeader';
import MovieGrid from './components/MovieGrid';
import Loading from './components/Loading';
import ErrorMessage from './components/Error';

export default function MyCollectionPage() {
  const { username } = useParams();

  // hook: fetch collection and handle redirect on 401 (same behavior)
  const { movies, loading, error } = useCollection(username);

  // hook: sorting
  const { sortedMovies, sortCriteria, setSortCriteria } = useSortedMovies(movies, 'title');

  if (loading) return <Loading />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <Container className="py-4">
      <CollectionHeader username={username} sortCriteria={sortCriteria} setSortCriteria={setSortCriteria} />

      {sortedMovies.length > 0 ? (
        <MovieGrid movies={sortedMovies} />
      ) : (
        <div>
          <p className="text-center">No movies added to collection yet.</p>
        </div>
      )}
    </Container>
  );
}
