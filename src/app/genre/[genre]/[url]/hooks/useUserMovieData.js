import { useState, useEffect } from "react";

export default function useUserMovieData(isLoggedIn, username, tmdb_id) {
  const [userMovieData, setUserMovieData] = useState(null);

  useEffect(() => {
    const fetchUserMovie = async () => {
      if (!isLoggedIn || !username || !tmdb_id) {
        setUserMovieData(null);
        return;
      }

      const res = await fetch(`/api/user/movies?username=${encodeURIComponent(username)}&tmdb_id=${tmdb_id}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setUserMovieData(data[0] || null);
    };

    fetchUserMovie();
  }, [isLoggedIn, username, tmdb_id]);

  const handleToggle = async (field) => {
    if (!isLoggedIn || !tmdb_id) return;

    const updatedState = {
      username,
      tmdb_id,
      is_liked: field === "is_liked" ? !(userMovieData?.is_liked ?? false) : userMovieData?.is_liked ?? false,
      is_wanted: field === "is_wanted" ? !(userMovieData?.is_wanted ?? false) : userMovieData?.is_wanted ?? false,
      is_seen: field === "is_seen" ? !(userMovieData?.is_seen ?? false) : userMovieData?.is_seen ?? false,
      watch_count: userMovieData?.watch_count ?? 0,
      personal_rating: userMovieData?.personal_rating ?? null,
      personal_review: userMovieData?.personal_review ?? null,
    };

    setUserMovieData(updatedState);

    try {
      await fetch(`/api/user/movies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(updatedState),
      });
    } catch (err) {
      console.error("Toggle error:", err);
      alert("Failed to update movie state");
    }
  };

  return { userMovieData, handleToggle };
}
