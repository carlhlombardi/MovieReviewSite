export default function MovieReviewSection({ my_rating, review }) {
  if (!my_rating && !review) return null;

  return (
    <div className="mt-4">
      {my_rating && (
        <>
          <h4>Our Rating</h4>
          <p>{my_rating}</p>
        </>
      )}
      {review && (
        <>
          <h4>Review</h4>
          <p>{review}</p>
        </>
      )}
    </div>
  );
}
