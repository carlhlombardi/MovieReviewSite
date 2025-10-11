import { useState } from "react";

// Hook to manage showing limited replies, "View more" style
export default function useReplies(initial) {
  initial = initial || []; // ✅ default to empty array
  const [visibleReplies, setVisibleReplies] = useState(initial.slice(0, 2));
  const [hasMore, setHasMore] = useState(initial.length > 2);

  const loadMore = () => {
    const next = initial.slice(0, visibleReplies.length + 2);
    setVisibleReplies(next);
    setHasMore(next.length < initial.length);
  };

  return { visibleReplies, hasMore, loadMore };
}
