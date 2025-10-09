'use client';

import { useState, useMemo } from 'react';

/**
 * Accepts movies array and returns sortedMovies + sort state setters.
 * Default sort criteria is 'title' (keeps same behavior you had).
 */
export default function useSortedMovies(initialMovies = [], initialSort = 'title') {
  const [sortCriteria, setSortCriteria] = useState(initialSort);

  const sortedMovies = useMemo(() => {
    const arr = [...(initialMovies || [])];
    arr.sort((a, b) => {
      const key = sortCriteria;
      const va = (a[key] ?? a.title ?? '').toString();
      const vb = (b[key] ?? b.title ?? '').toString();
      return va.localeCompare(vb);
    });
    return arr;
  }, [initialMovies, sortCriteria]);

  return { sortedMovies, sortCriteria, setSortCriteria };
}
