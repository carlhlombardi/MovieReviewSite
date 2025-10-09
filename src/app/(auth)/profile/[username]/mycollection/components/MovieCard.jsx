'use client';

import Link from 'next/link';
import Image from 'next/image';
import styles from '../MyCollectionPage.module.css';

export default function MovieCard({ movie }) {
  const url = movie.url;
  const genre = movie.genre ?? '';
  const image = movie.image_url ? decodeURIComponent(movie.image_url) : '/images/fallback.jpg';
  const title = movie.film || movie.title || '';

  return (
    <Link href={`/genre/${genre}/${encodeURIComponent(url)}`} className="text-decoration-none">
      <div className={`${styles.imagewrapper} position-relative`}>
        <Image
          src={image}
          alt={title}
          width={200}
          height={300}
          className="img-fluid rounded"
        />
      </div>
    </Link>
  );
}
