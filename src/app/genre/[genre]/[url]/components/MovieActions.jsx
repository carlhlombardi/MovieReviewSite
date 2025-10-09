import { Button } from "react-bootstrap";
import { Heart, HeartFill, Tv, TvFill, Eye, EyeFill } from "react-bootstrap-icons";

export default function MovieActions({ userMovieData, handleToggle }) {
  const isOwned = userMovieData?.is_liked ?? false;
  const isWanted = userMovieData?.is_wanted ?? false;
  const isSeen = userMovieData?.is_seen ?? false;

  return (
    <div className="my-3 d-flex flex-wrap gap-2">
      <Button
        variant={isOwned ? "danger" : "outline-danger"}
        onClick={() => handleToggle("is_liked")}
      >
        {isOwned ? <HeartFill /> : <Heart />} Own It
      </Button>

      <Button
        variant={isWanted ? "primary" : "outline-primary"}
        onClick={() => handleToggle("is_wanted")}
      >
        {isWanted ? <TvFill /> : <Tv />} Want It
      </Button>

      <Button
        variant={isSeen ? "success" : "outline-success"}
        onClick={() => handleToggle("is_seen")}
      >
        {isSeen ? <EyeFill /> : <Eye />} Seen It
      </Button>
    </div>
  );
}
