'use client';
import { Card, Tabs, Tab, Button } from 'react-bootstrap';
import Link from 'next/link';
import MovieList from './MovieList';

export default function MovieTabs({
  ownedMovies,
  wantedMovies,
  seenMovies,
  ownedCount,
  wantedCount,
  seenCount,
  username
}) {
  return (
    <Card className="mb-4">
      <Card.Body>
        <Tabs defaultActiveKey="owned" id="movie-tabs" className="mb-3">
          <Tab eventKey="owned" title={`Owned (${ownedCount})`}>
            <MovieList movies={ownedMovies} />
            {ownedCount > 6 && (
              <div className="mt-3 text-center">
                <Link href={`/profile/${username}/owned`}>
                  <Button variant="outline-primary">See all owned</Button>
                </Link>
              </div>
            )}
          </Tab>

          <Tab eventKey="wanted" title={`Wanted (${wantedCount})`}>
            <MovieList movies={wantedMovies} />
            {wantedCount > 6 && (
              <div className="mt-3 text-center">
                <Link href={`/profile/${username}/wanted`}>
                  <Button variant="outline-primary">See all wanted</Button>
                </Link>
              </div>
            )}
          </Tab>

          <Tab eventKey="seen" title={`Seen (${seenCount})`}>
            <MovieList movies={seenMovies} />
            {seenCount > 6 && (
              <div className="mt-3 text-center">
                <Link href={`/profile/${username}/seen`}>
                  <Button variant="outline-primary">See all seen</Button>
                </Link>
              </div>
            )}
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}
