import { useState, useEffect } from "react";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function useNewlyReviewedMovies() {
  const [newlyReviewed, setNewlyReviewed] = useState([]);

  useEffect(() => {
    const fetchNewlyReviewed = async () => {
      try {
        const res = await fetch(`${API_URL}/api/data/newlyreviewed?limit=9`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setNewlyReviewed(data.results || []);
      } catch {
        console.error("❌ Could not load newly reviewed movies");
      }
    };
    fetchNewlyReviewed();
  }, []);

  return newlyReviewed;
}
