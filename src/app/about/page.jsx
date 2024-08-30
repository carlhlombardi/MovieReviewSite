// pages/about.js
import { Container, Row, Col, Card, ListGroup, ListGroupItem } from 'react-bootstrap';

const About = () => {
  return (
    <Container fluid className="py-5">
      <Row>
        <Col md={12} className="text-center mb-4">
          <h1 className="display-4">About Us</h1>
          <p className="lead">Welcome to our movie review site! We provide honest and comprehensive reviews to help you make informed decisions about what to watch next.</p>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Our Mission</Card.Title>
              <Card.Text>
                Our mission is to deliver detailed and insightful movie reviews that cater to both casual viewers and cinephiles alike. We strive to offer a balanced perspective on each film, focusing on what makes it unique and worth watching.
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Body>
              <Card.Title>Grading Rubric</Card.Title>
              <ListGroup variant="flush">
                <ListGroupItem><strong>90-100</strong> Evaluates the plot, coherence, and originality.</ListGroupItem>
                <ListGroupItem><strong>80-89</strong> Assesses the performances of the actors and their believability.</ListGroupItem>
                <ListGroupItem><strong>70-79</strong> Considers the directors vision, pacing, and execution.</ListGroupItem>
                <ListGroupItem><strong>60-69</strong> Looks at the visual style, camera work, and overall aesthetic.</ListGroupItem>
                <ListGroupItem><strong>50-59</strong> Reviews the music, sound effects, and their impact on the film.</ListGroupItem>
                <ListGroupItem><strong>40-49</strong> Provides a summary of the overall impression and entertainment value.</ListGroupItem>
                <ListGroupItem><strong>30-39</strong> Assesses the performances of the actors and their believability.</ListGroupItem>
                <ListGroupItem><strong>20-29</strong> Considers the directors vision, pacing, and execution.</ListGroupItem>
                <ListGroupItem><strong>10-19</strong> Looks at the visual style, camera work, and overall aesthetic.</ListGroupItem>
                <ListGroupItem><strong>0-9</strong> A movie in this range is pratically unwatchable. The amount of basic filmmaking errors defy logic and wouldnt be made by a third grader.</ListGroupItem>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default About;
