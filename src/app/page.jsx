"use client";
import { Container } from "react-bootstrap";
import { useRouter } from "next/navigation";
import useMovieSearch from "./home/hooks/useMovieSearch";
import useNewlyAddedMovies from "./home/hooks/useNewlyAddedMovies";
import useNewlyReviewedMovies from "./home/hooks/useNewlyReviewedMovies";
import SearchBar from "./home/components/SearchBar";
import SuggestionList from "./home/components/SuggestionList";
import MovieGrid from "./home/components/MovieGrid";
import { handleSuggestionClick as handleSuggestionLogic } from "./home/handleSuggestionLogic";

export default function Home() {
  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    suggestions,
    showSuggestions,
    setShowSuggestions,
    inputRef,
    suggestionsRef,
    handleInputChange,
  } = useMovieSearch(router);

  const newlyAdded = useNewlyAddedMovies();
  const newlyReviewed = useNewlyReviewedMovies();

  const handleSuggestionClick = (movie) => {
    handleSuggestionLogic(movie, setSearchQuery, setShowSuggestions, router);
  };

  return (
    <Container className="py-5">
      <h1 className="text-center mb-4">Movie Search</h1>
      <SearchBar
        searchQuery={searchQuery}
        handleInputChange={handleInputChange}
        inputRef={inputRef}
        onFocus={() => searchQuery && setShowSuggestions(true)}
      />
      {showSuggestions && (
        <SuggestionList
          suggestions={suggestions}
          suggestionsRef={suggestionsRef}
          onClick={handleSuggestionClick}
        />
      )}
      <MovieGrid title="Newly Added Films" movies={newlyAdded} />
      <MovieGrid title="Newly Reviewed Films" movies={newlyReviewed} />
    </Container>
  );
}
