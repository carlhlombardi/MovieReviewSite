// hooks/useSortedMovies.js
"use client";

import { useState, useMemo } from "react";

export function useSortedMovies(movies, defaultCriteria = "film") {
  const [sortCriteria, setSortCriteria] = useState(defaultCriteria);

  const sortedMovies = useMemo(() => {
    return [...(movies || [])].sort((a, b) => {
      const va = (a[sortCriteria] ?? "").toString();
      const vb = (b[sortCriteria] ?? "").toString();
      return va.localeCompare(vb);
    });
  }, [movies, sortCriteria]);

  return { sortedMovies, sortCriteria, setSortCriteria };
}
