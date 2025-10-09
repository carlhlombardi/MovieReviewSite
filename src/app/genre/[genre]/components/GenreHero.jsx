import styles from "../GenrePage.module.css";

const GENRE_DISPLAY_NAMES = {
  action: "Action Films",
  adventure: "Adventure Films",
  animation: "Animated Films",
  comedy: "Comedy Films",
  crime: "Crime Films",
  documentary: "Documentary Films",
  drama: "Drama Films",
  family: "Family Films",
  fantasy: "Fantasy Films",
  history: "History/Historical Films",
  horror: "Horror Films",
  music: "Musicals and Music Films",
  mystery: "Mystery Films",
  romance: "Romance Films",
  sciencefiction: "Science Fiction Films",
  thriller: "Thriller Films",
  tvmovie: "Made For TV Films",
  war: "War Films",
  western: "Western Films"
};

function formatGenreName(slug) {
  const lower = slug?.toLowerCase() || "";
  return GENRE_DISPLAY_NAMES[lower] || (lower.charAt(0).toUpperCase() + lower.slice(1));
}

export default function GenreHero({ genre }) {
  return (
    <div className={styles.hero}>
      <h1 className={styles.heroTitle}>{formatGenreName(genre)}</h1>
    </div>
  );
}
