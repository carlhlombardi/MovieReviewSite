import { Button, Row, Col } from "react-bootstrap";

export default function GenreSortControls({ sortCriteria, setSortCriteria }) {
  const options = ["film", "year", "studio", "my_rating"];

  return (
    <Row className="mt-3 mb-4 text-center">
      <Col>
        <label className="me-2">Sort by:</label>
        <div className="d-flex flex-wrap justify-content-center">
          {options.map((criteria) => (
            <Button
              key={criteria}
              variant={sortCriteria === criteria ? "primary" : "secondary"}
              onClick={() => setSortCriteria(criteria)}
              className={`m-1 ${sortCriteria === criteria ? "active" : ""}`}
            >
              {criteria === "my_rating" ? "Rating" : criteria.charAt(0).toUpperCase() + criteria.slice(1)}
            </Button>
          ))}
        </div>
      </Col>
    </Row>
  );
}
