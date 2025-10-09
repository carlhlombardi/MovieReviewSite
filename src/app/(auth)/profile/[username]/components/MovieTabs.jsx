'use client';
import { Card, Tabs, Tab, Button } from 'react-bootstrap';
import Link from 'next/link';
import MovieList from './MovieList';
import styles from './MovieTabs.module.css';

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
        <Tabs
          defaultActiveKey="owned"
          id="movie-tabs"
          className={`mb-3 ${styles.responsiveTabs}`}
        >
          {/* Owned Movies */}
          <Tab eventKey="owned" title={`Owned (${ownedCount})`}>
            <MovieList movies={ownedMovies} />
            {ownedCount > 6 && (
              <div className="mt-3 text-center">
                <Link href={`/profile/${username}/mycollection`}>
                  <Button variant="outline-primary">See All Owned</Button>
                </Link>
              </div>
            )}
          </Tab>

          {/* Wanted Movies */}
          <Tab eventKey="wanted" title={`Wanted (${wantedCount})`}>
            <MovieList movies={wantedMovies} />
            {wantedCount > 6 && (
              <div className="mt-3 text-center">
                <Link href={`/profile/${username}/wantedformycollection`}>
                  <Button variant="outline-primary">See All Wanted</Button>
                </Link>
              </div>
            )}
          </Tab>

          {/* Seen Movies */}
          <Tab eventKey="seen" title={`Seen (${seenCount})`}>
            <MovieList movies={seenMovies} />
            {seenCount > 6 && (
              <div className="mt-3 text-center">
                <Link href={`/profile/${username}/seenit`}>
                  <Button variant="outline-primary">See All Seen</Button>
                </Link>
              </div>
            )}
          </Tab>
        </Tabs>
      </Card.Body>
    </Card>
  );
}
