"use client";

import Link from "next/link";
import Image from "next/image";

export default function MovieCard({ item }) {
  const genre = item?.genre || "unknown";
  const filmUrl = item?.url || item?.tmdb_id?.toString() || "#";
  const image = item?.image_url
    ? decodeURIComponent(item.image_url)
    : "/images/fallback.jpg";
  const title = item?.film || "Untitled";

  return (
    <Link
      href={`/genre/${genre}/${encodeURIComponent(filmUrl)}`}
      className="text-decoration-none"
    >
      <div className="position-relative">
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
