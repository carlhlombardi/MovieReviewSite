"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function MyCollectionPage() {
  const { username } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    const fetchMovies = async () => {
      try {
        const res = await fetch(`/api/profile/${username}/mycollection`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setMovies(data.movies || []);
      } catch (err) {
        console.error("Error fetching mycollection:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [username]);

  if (loading) return <p>Loading…</p>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{username}’s Collection</h1>
      {movies.length === 0 ? (
        <p>No movies yet.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4">
          {movies.map((movie) => (
            <li key={movie.id} className="border rounded p-2">
              <h2 className="font-semibold">{movie.title}</h2>
              <p className="text-sm text-gray-600">{movie.year}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
