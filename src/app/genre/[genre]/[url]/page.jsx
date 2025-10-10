"use client";
import { Container, Alert, Spinner, Row, Col } from "react-bootstrap";
import { useAuth } from "@/app/(auth)/context/AuthContext";
import useMovieData from "./hooks/useMovieData";
import useUserMovieData from "./hooks/useUserMovieData";
import MovieDetailHeader from "./components/MovieDetailHeader";
import MovieActions from "./components/MovieActions";
import MovieReviewSection from "./components/MovieReviewSection";
import MovieImage from "./components/MovieImage";
import CommentSection from "./components/CommentSection"; // ✅ Import the new component

export default function MoviePage({ params }) {
  const { genre, url } = params;
  const { isLoggedIn, user } = useAuth();

  const { movieData, isLoading, error } = useMovieData(genre, url);
  const { userMovieData, handleToggle } = useUserMovieData(
    isLoggedIn,
    user?.username,
    movieData?.tmdb_id
  );

  if (isLoading)
    return (
      <Spinner
        animation="border"
        role="status"
        className="d-block mx-auto my-5"
      />
    );

  if (error)
    return (
      <Alert variant="danger" className="my-5">
        {error}
      </Alert>
    );

  if (!movieData)
    return (
      <Alert variant="warning" className="my-5">
        Movie not found
      </Alert>
    );

    console.log("🎬 MoviePage data:", {
  tmdb_id: movieData?.tmdb_id,
  title: movieData?.film,
  username: user?.username,
});

  return (
    <Container className="my-5">
      <Row>
        <Col xs={12} md={6} className="text-center order-md-2 mb-3">
          <MovieImage film={movieData.film} image_url={movieData.image_url} />
        </Col>
        <Col xs={12} md={6} className="order-md-1">
          <MovieDetailHeader movie={movieData} />
          {isLoggedIn && (
            <MovieActions
              userMovieData={userMovieData}
              handleToggle={handleToggle}
            />
          )}
        </Col>
      </Row>

      <Row>
        <Col>
          <MovieReviewSection
            my_rating={movieData.my_rating}
            review={movieData.review}
          />
        </Col>
      </Row>

      {/* 💬 Comment Section */}
      <Row>
        <Col>
          <CommentSection
            tmdb_id={movieData.tmdb_id}
            username={user?.username ?? null}
          />
        </Col>
      </Row>
    </Container>
  );
}
