"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCollection } from "./hooks/useCollection";
import Image from "next/image";

export default function CollectionPage() {
  const router = useRouter();
  const [username, setUsername] = useState(null);

  // 🟡 Get logged-in user from localStorage (or session)
  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    } else {
      router.replace("/login"); // ⬅️ Use replace to avoid going back to this page
    }
  }, [router]);

  const { movies, loading, error } = useCollection(username);

  // ⏳ Don't render until username is known
  if (!username) return null;
  if (loading) return <p className="p-4">Loading your collection…</p>;
  if (error) return <p className="p-4 text-red-500">❌ {error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">🎬 My Collection</h1>

      {movies.length === 0 ? (
        <p>You haven’t added any movies yet.</p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((movie) => {
            const imgSrc = movie.image_url
              ? decodeURIComponent(movie.image_url)
              : "/placeholder.jpg"; // 🖼️ fallback image if none

            return (
              <li
                key={movie.tmdb_id}
                className="border rounded-lg overflow-hidden shadow-sm bg-white"
              >
<Image
  src={imgSrc}
  alt={movie.film || "Movie poster"}
  width={300}               // good default width for layout
  height={450}              // maintain 2:3 ratio
  className="w-full h-auto object-cover rounded-t-lg"
  unoptimized               // ⬅️ if you're using external URLs without configuring domains
  onError={(e) => (e.target.src = "/placeholder.jpg")}
/>
                <div className="p-2">
                  <h2 className="font-semibold text-sm truncate">
                    {movie.film}
                  </h2>
                  <p className="text-xs text-gray-500">{movie.genre}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
