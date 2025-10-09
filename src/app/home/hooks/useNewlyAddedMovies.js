import { useState, useEffect } from "react";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function useNewlyAddedMovies() {
  const [newlyAdded, setNewlyAdded] = useState([]);

  useEffect(() => {
    const fetchNewlyAdded = async () => {
      try {
        const res = await fetch(`${API_URL}/api/data/newlyadded?limit=9`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setNewlyAdded(data.results || []);
      } catch {
        console.error("❌ Could not load newly added movies");
      }
    };
    fetchNewlyAdded();
  }, []);

  return newlyAdded;
}
