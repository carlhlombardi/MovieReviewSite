import { Container, Row, Col } from 'react-bootstrap';
import Image from 'next/image';
import Link from 'next/link';

const Footer = () => (
  <footer className="page-footer font-small blue pt-4">
    <Container>
      <Row>
        <Col md={6} className="text-center mb-3">
          <Image
            src="/images/logo/logo.png" // Use the image URL directly from the database
            alt="Logo" // Alt text for accessibility
            width={250}
            height={125}
            className="img-fluid"
          />
        </Col>

        <Col md={3} className="mt-3 mb-3 text-center">
          <h5 className="text-uppercase">Pages</h5>
          <ul className="list-unstyled">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </Col>

        <Col md={3} className="mt-3 mb-3 text-center">
          <h5 className="text-uppercase">Genres</h5>
          <ul className="list-unstyled">
            <li><Link href="/genre/action">Action</Link></li>
            <li><Link href="/genre/classic">Classic</Link></li>
            <li><Link href="/genre/comedy">Comedy</Link></li>
            <li><Link href="/genre/documentary">Documentary</Link></li>
            <li><Link href="/genre/drama">Drama</Link></li>
            <li><Link href="/genre/horror">Horror</Link></li>
            <li><Link href="/genre/sci-fi">Sci-Fi</Link></li>
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
