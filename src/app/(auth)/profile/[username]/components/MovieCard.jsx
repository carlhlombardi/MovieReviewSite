"use client";

import Link from "next/link";
import Image from "next/image";

export default function MovieCard({ item }) {
  return (
    <Link
      href={`/genre/${item.genre}/${encodeURIComponent(item.url)}`}
      className="text-decoration-none"
    >
      <div className="position-relative">
        <Image
          src={
            item.image_url
              ? decodeURIComponent(item.image_url)
              : "/images/fallback.jpg"
          }
          alt={item.film}
          width={200}
          height={300}
          className="img-fluid rounded"
        />
      </div>
    </Link>
  );
}
