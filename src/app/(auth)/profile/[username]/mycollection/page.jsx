// app/profile/[profilename]/mycollection/page.js
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function MyCollectionPage() {
  const { profilename } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profilename) return;
    const fetchCollection = async () => {
      try {
        const res = await fetch(`/api/profile/${profilename}/mycollection`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') ?? ''}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to load collection');
        }
        const data = await res.json();
        setMovies(data.movies ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCollection();
  }, [profilename]);

  if (loading) return <p className="text-center mt-10">Loading…</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {profilename}’s My Collection
      </h1>
      {movies.length === 0 ? (
        <p className="text-gray-500">No liked movies yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {movies.map((movie) => (
            <div
              key={movie.url}
              className="bg-white rounded-2xl shadow-md overflow-hidden"
            >
              <img
                src={movie.image_url}
                alt={movie.title}
                className="w-full h-56 object-cover"
              />
              <div className="p-3">
                <h3 className="font-semibold text-lg">{movie.title}</h3>
                <p className="text-sm text-gray-500">{movie.genre}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
