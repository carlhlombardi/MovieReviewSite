import Head from 'next/head';
import { Container, Row, Col } from 'react-bootstrap';

const AboutPage = () => {
  return (
    <>
      <Head>
        <title>About | Reel Film Reviews</title>
        <meta name="description" content="About Reel Film Reviews, a Movie Review Site based in New Jersey" />
        <meta property="og:title" content="About | Reel Film Reviews" />
        <meta property="og:description" content="About Reel Film Reviews, a Movie Review Site based in New Jersey" />
      </Head>
      <Container>
        <Row>
          <Col>
        <h1>About Reel Film Reviews</h1>
        <p>Welcome to our movie review site...</p>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default AboutPage;