"use client";
import Link from "next/link";
import Image from "next/image";
import styles from "../../page.module.css";

const slugify = (title, tmdb_id) =>
  `${title}-${tmdb_id}`
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const slugifyGenre = (genre) =>
  genre.toString().toLowerCase().replace(/[^a-z0-9]+/g, "").trim();

export default function MovieCard({ movie }) {
  return (
    <Link
      href={`/genre/${slugifyGenre(movie.genre)}/${slugify(movie.film, movie.tmdb_id)}`}
      className="text-decoration-none"
    >
      <div className={`${styles.imagewrapper} position-relative`}>
        <Image
          src={decodeURIComponent(movie.image_url || "/images/fallback.jpg")}
          alt={movie.film}
          width={200}
          height={300}
          className="img-fluid rounded"
        />
      </div>
    </Link>
  );
}
