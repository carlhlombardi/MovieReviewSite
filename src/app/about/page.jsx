import Head from 'next/head';
import { Container, Row, Col, Card, ListGroup} from 'react-bootstrap';


const AboutPage = () => {
  return (
    <>
      <Head>
        <title>About | Reel Film Reviews</title>
        <meta name="description" content="About Reel Film Reviews, a Movie Review Site based in New Jersey" />
        <meta property="og:title" content="About | Reel Film Reviews" />
        <meta property="og:description" content="About Reel Film Reviews, a Movie Review Site based in New Jersey" />
      </Head>
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
              <ListGroup.Item><strong>90-100</strong> A true classic of cinema. A practically flawless film which is revered by fans, even if they dislike the genre. These films set the standard for excellence and are often referenced in discussions about the best movies of all time. They are timeless, influential, and leave a lasting impact on viewers.</ListGroup.Item>
<ListGroup.Item><strong>80-89</strong> A strong contender to be the type of film which stands out for its exceptional quality. These movies are highly regarded and often receive critical acclaim. They may have minor flaws, but their strengths far outweigh any weaknesses. They are memorable, well-crafted, and often feature outstanding performances or innovative storytelling.</ListGroup.Item>
<ListGroup.Item><strong>70-79</strong> These films are solid and enjoyable, with good storytelling and production values. They may not be groundbreaking, but they are well-crafted and worth watching. These movies are entertaining and competently made, often appealing to a wide audience. They may not achieve greatness, but they are certainly commendable.</ListGroup.Item>
<ListGroup.Item><strong>60-69</strong> These movies are decent but may have noticeable flaws that prevent them from being great. They are still watchable and can be appreciated for their artistic elements. These films might suffer from issues like pacing problems, uneven performances, or a lack of originality, but they still offer some enjoyable moments.</ListGroup.Item>
<ListGroup.Item><strong>50-59</strong> This is for films that are average. They may have some redeeming qualities, but they are often forgettable and lack the impact of higher-rated movies. These films are okay for a one-time watch but are unlikely to leave a lasting impression. They often feel formulaic or uninspired, lacking a unique voice.</ListGroup.Item>
<ListGroup.Item><strong>40-49</strong> This is the lower end of mediocre. The type of movie that leans toward being bad, but it moreso was just meh. There is nothing blatantly offensive from films here, but they are rarely a film you will want to watch again. These movies are often plagued by poor execution or lackluster storytelling.</ListGroup.Item>
<ListGroup.Item><strong>30-39</strong> The tier of its so bad, its good. Put simply, these films are trash, but they are trash with value. Think of a movie where the acting was horrible, but you laughed with friends due to the absurdity of what you are watching. There may be flaws, but the experience is somehow enjoyable.</ListGroup.Item>
<ListGroup.Item><strong>20-29</strong> This is the lower tier of the films where someone would refer to them as so bad, they are good. These films are so bad, they are just bad. True abominations of cinema and filmmaking go lower than this, but the run-of-the-mill boring bad film might find itself here.</ListGroup.Item>
<ListGroup.Item><strong>10-19</strong> A score in this range means that while the plot of the film may be incoherent, at least it was shot in focus. Films here have one glaring flaw, but not multiple flaws. They are barely watchable and often frustrating to sit through. These movies might have a decent idea but fail in execution.</ListGroup.Item>
<ListGroup.Item><strong>0-9</strong> Films in this tier are simply unwatchable due to glaring flaws that sully the entire experience. This is for the films that are truly trash and lack any redeeming qualities. A third grader could make a better film. These movies are often considered the worst of the worst and are best avoided.</ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </>
  );
};

export default AboutPage;