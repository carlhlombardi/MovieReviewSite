export default function MovieDetailHeader({ movie }) {
  const { film, year, studio, director, screenwriters, producer, run_time } = movie;
  return (
    <>
      <h2 className="text-center">{film} {year && `(${year})`}</h2>
      {studio && <p><strong>Studio:</strong> {studio}</p>}
      {director && <p><strong>Director:</strong> {director}</p>}
      {screenwriters && <p><strong>Screenwriters:</strong> {screenwriters}</p>}
      {producer && <p><strong>Producer:</strong> {producer}</p>}
      {run_time && <p><strong>Runtime:</strong> {run_time} minutes</p>}
    </>
  );
}
