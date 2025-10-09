export default function MovieInfoSection({ movie }) {
  return (
    <div className="mb-4">
      {movie.overview && <p>{movie.overview}</p>}
      {movie.runtime && <p><strong>Runtime:</strong> {movie.runtime} min</p>}
      {movie.director && <p><strong>Director:</strong> {movie.director}</p>}
    </div>
  );
}
