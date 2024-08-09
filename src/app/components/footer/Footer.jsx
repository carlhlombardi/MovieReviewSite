import { Container, Row, Col } from 'react-bootstrap';
import Image from 'next/image';

const Footer = () => (
  <footer className="page-footer font-small blue pt-4">
    <Container>
      <Row>
        <Col md={6} className="text-center mb-3">
        <Image
                src={"/images/logo/logo.png"} // Use the image URL directly from the database
                alt={"Logo"}      // Alt text for accessibility
                width={160}
                height={16}
              />
        </Col>

        <Col md={3} className="mb-3 text-center">
          <h5 className="text-uppercase">Pages</h5>
          <ul className="list-unstyled">
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </Col>

        <Col md={3} className="mb-3 text-center">
          <h5 className="text-uppercase">Genres</h5>
          <ul className="list-unstyled">
            <li><a href="/genre/horror">Horror</a></li>
            <li><a href="/genre/sci-fi">Sci-Fi</a></li>
          </ul>
        </Col>
      </Row>
    </Container>

    <div className="footer-copyright text-center py-3">
      © 2024 Copyright: <a href="https://carlhlombardi.com/"> carlhlombardi.com</a>
    </div>
  </footer>
);

export default Footer;
