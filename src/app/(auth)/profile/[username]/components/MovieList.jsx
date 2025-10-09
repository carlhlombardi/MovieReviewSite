'use client';
import Link from 'next/link';
import Image from 'next/image';

export default function MovieList({ movies }) {
  if (movies.length === 0) return <p className="text-muted">No movies yet.</p>;

  return (
    <div className="d-flex flex-wrap gap-3">
      {movies.map((movie) => (
        <div key={movie.id} style={{ width: 150 }}>
          <Link href={`/genre/${encodeURIComponent(movie.genre)}/${encodeURIComponent(movie.title)}`}>
            <Image
              src={movie.poster_url || '/images/placeholder.png'}
              alt={movie.title}
              width={150}
              height={225}
              style={{ objectFit: 'cover', borderRadius: 8 }}
            />
          </Link>
          <p className="mt-2 text-center text-truncate">{movie.title}</p>
        </div>
      ))}
    </div>
  );
}
