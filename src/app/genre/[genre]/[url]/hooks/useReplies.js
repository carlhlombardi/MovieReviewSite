"use client";
import { useState } from "react";

export default function useReplies(initialReplies = [], batchSize = 3) {
  const [visibleCount, setVisibleCount] = useState(batchSize);
  const [replies, setReplies] = useState(initialReplies);

  const visibleReplies = replies.slice(0, visibleCount);
  const hasMore = replies.length > visibleCount;

  const loadMore = () => {
    setVisibleCount((prev) => prev + batchSize);
  };

  const addReply = (newReply) => {
    setReplies((prev) => [newReply, ...prev]);
  };

  const updateReplies = (updated) => setReplies(updated);

  return {
    replies,
    visibleReplies,
    hasMore,
    loadMore,
    addReply,
    updateReplies,
  };
}
