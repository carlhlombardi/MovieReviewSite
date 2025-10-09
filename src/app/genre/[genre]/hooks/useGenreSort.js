import { useState, useEffect } from "react";

export default function useGenreSort(data) {
  const [sortCriteria, setSortCriteria] = useState("film");
  const [sortedItems, setSortedItems] = useState([]);

  useEffect(() => {
    const sorted = [...data].sort((a, b) => {
      const key = sortCriteria;
      if (key === "year") {
        return (Number(a.year) || 0) - (Number(b.year) || 0);
      }
      if (key === "my_rating") {
        return (Number(b.my_rating) || 0) - (Number(a.my_rating) || 0);
      }
      const va = (a[key] ?? a.film ?? "").toString();
      const vb = (b[key] ?? b.film ?? "").toString();
      return va.localeCompare(vb);
    });

    setSortedItems(sorted);
  }, [data, sortCriteria]);

  return { sortedItems, sortCriteria, setSortCriteria };
}
